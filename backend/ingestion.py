import os
import json
import time
import semchunk
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from groq import Groq
from dotenv import load_dotenv
import fitz  # PyMuPDF
import gc    # Garbage Collector

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --- 1. CONFIGURE FOR MAXIMUM STABILITY ---
SOURCE_DIR = "./data"
STORAGE_DIR = "./storage"

pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = False       # No heavy OCR
pipeline_options.do_table_structure = True 

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)

# Use cl100k_base for accurate Llama-3/GPT-4 token counts
chunker = semchunk.chunkerify('cl100k_base', 600) 

def get_page_keywords(text):
    """Enriches the page. Adds a 1.5s delay to be kind to the API."""
    time.sleep(1.5) # The 'Slow Down' button
    try:
        response = client.chat.completions.create(
            messages=[{"role": "system", "content": "Extract 5-8 specific policy keywords from this text. Return ONLY a comma-separated list."},
                      {"role": "user", "content": text[:1500]}],
            model="llama-3.1-8b-instant"
        )
        return [k.strip() for k in response.choices[0].message.content.split(",")]
    except Exception:
        return ["general"]

def process_pdf(file_path, file_name):
    print(f"⌛ Starting Deep Analysis: {file_name}...")
    md_text = ""
    
    # --- 1. THE GATEKEEPER (Stability Check) ---
    doc_check = fitz.open(file_path)
    total_pages = len(doc_check)
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    doc_check.close()

    # Pre-emptive fallback for memory safety
    use_fallback = total_pages > 30 or file_size_mb > 5

    if not use_fallback:
        try:
            print(f"  🧠 Using High-Quality Mode (Docling) for {total_pages} pages...")
            result = converter.convert(file_path)
            
            # THE FIX: Don't just export the whole thing. 
            # We need to iterate through the Docling pages to add our markers.
            md_pages = []
            for i, page in enumerate(result.document.pages):
                # Export individual page to markdown
                page_md = result.document.export_to_markdown(page_no=i+1)
                md_pages.append(f"## Page {i + 1}\n\n{page_md}\n\n---\n\n")
            
            md_text = "".join(md_pages)
            
            if len(md_text) < (total_pages * 100):
                raise MemoryError("Incomplete Extraction")
            print("  ✨ Docling conversion successful with standardized markers.")
        except Exception as e:
            print(f"  ⚠️ Docling failed or markers failed: {e}")
            use_fallback = True

    if use_fallback:
        print(f"  ⚡ Using Light-Mode (PyMuPDF) for {total_pages} pages...")
        doc = fitz.open(file_path)
        md_pages = [f"## Page {num + 1}\n\n{p.get_text('text')}\n\n---\n\n" for num, p in enumerate(doc)]
        md_text = "".join(md_pages)
        doc.close()

    # --- 2. THE STORAGE ---
    # Save full MD so the Expert can always access any page
    md_output_path = os.path.join(STORAGE_DIR, file_name.replace(".pdf", ".md"))
    with open(md_output_path, "w", encoding="utf-8") as f:
        f.write(md_text)

    # --- 3. TWO-TIER ENRICHMENT (The "Hybrid Map") ---
    all_pages = [p for p in md_text.split("\n\n---\n\n") if p.strip()]
    enriched_structure = []

    for i, page_text in enumerate(all_pages):
        page_num = i + 1
        
        # TIER 1: Deep Mapping (First 40 pages)
        if i < 40:
            print(f"  → [Deep Map] Page {page_num}/{len(all_pages)}...")
            keywords = get_page_keywords(page_text)
        
        # TIER 2: Rapid Mapping (Page 41 to End)
        else:
            if i % 10 == 0: # Print status every 10 pages to keep console clean
                print(f"  → [Rapid Map] Page {page_num}/{len(all_pages)}...")
            
            # Extract first 3 lines as "Hint Keywords" - fast and free!
            lines = [l.strip("# ") for l in page_text.split('\n') if l.strip()][:3]
            keywords = ["Extended Content"] + lines

        chunks = chunker(page_text)
        
        enriched_structure.append({
            "page": page_num,
            "keywords": keywords,
            "preview": page_text[:250].replace("\n", " ").strip() + "...",
            "chunks_count": len(chunks)
        })

    # Save final JSON Tree
    tree_data = {
        "document": file_name,
        "category": os.path.basename(os.path.dirname(file_path)),
        "total_pages": len(all_pages),
        "structure": enriched_structure
    }
    
    with open(os.path.join(STORAGE_DIR, file_name.replace(".pdf", "_tree.json")), "w", encoding="utf-8") as f:
        json.dump(tree_data, f, indent=2)
        
    print(f"✅ Finished: {file_name} (Full 100% Coverage)\n")
    gc.collect()


if __name__ == "__main__":
    # --- 1. SETUP ---
    # This creates the storage directory if you deleted it
    if not os.path.exists(STORAGE_DIR):
        print(f"📁 Creating missing storage directory at: {STORAGE_DIR}")
        os.makedirs(STORAGE_DIR)
    
    print(f"🚀 Starting PDF Ingestion from {SOURCE_DIR}...")
    print(f"📍 Full Path: {os.path.abspath(SOURCE_DIR)}")
    
    files_processed = 0

    # --- 2. THE CRAWLER ---
    # os.walk ensures we go into subfolders like /pollution, /legal, etc.
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.lower().endswith(".pdf"):
                full_path = os.path.join(root, file)
                
                # Run the two-tier analysis
                process_pdf(full_path, file)
                
                files_processed += 1
                # Small cool-down to prevent API rate limiting
                time.sleep(2) 

    # --- 3. SUMMARY ---
    if files_processed == 0:
        print(f"⚠️ No PDF files found! Double-check that your PDFs are inside: {os.path.abspath(SOURCE_DIR)}")
    else:
        print(f"\n✅ Mission Accomplished. {files_processed} files processed into {STORAGE_DIR}")