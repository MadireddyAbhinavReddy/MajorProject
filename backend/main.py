import os
import re
import json
import difflib
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# 1. SETUP
load_dotenv()
app = FastAPI(title="Clarity.AI Policy Chatbot")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_ROOT = "./storage"
MODEL_NAME = "llama-3.1-8b-instant" 

class ChatRequest(BaseModel):
    query: str

# --- QUERY CLASSIFIER ---
def classify_query(query: str) -> dict:
    """
    Returns { "type": "policy" | "science" | "offtopic", "reason": str }
    - policy   → run full RAG pipeline (laws, standards, penalties, compliance, waste, climate docs)
    - science  → answer directly from LLM general knowledge (environmental science concepts)
    - offtopic → decline politely
    """
    resp = client.chat.completions.create(
        messages=[{
            "role": "user",
            "content": f"""You are a query classifier for an Indian Environmental Policy assistant.

Classify the following query into exactly one of three categories:

1. "policy" — The query is about Indian environmental law, regulations, standards, penalties, compliance, 
   consent procedures, waste management rules, AQI standards, GRAP, NCAP, NAAQS, industry categories, 
   climate reports, or health guidelines tied to pollution. These require looking up official documents.

2. "science" — The query is a general environmental or scientific question (e.g. "what is PM2.5?", 
   "how does ozone form?", "what causes acid rain?") that can be answered from general knowledge 
   without needing specific Indian policy documents.

3. "offtopic" — The query has nothing to do with environment, pollution, climate, health impacts of 
   air quality, or Indian policy (e.g. cricket scores, cooking recipes, coding help, personal advice).

Query: "{query}"

Return ONLY JSON: {{"type": "policy" | "science" | "offtopic", "reason": "one sentence"}}"""
        }],
        model=MODEL_NAME,
        response_format={"type": "json_object"}
    )
    try:
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {"type": "policy", "reason": "classification failed, defaulting to policy lookup"}

# 2. UTILITY: EXTRACT TARGETED TEXT
def get_relevant_md_content(file_name, target_pages):
    all_files = [f for f in os.listdir(STORAGE_ROOT) if f.endswith(".md")]
    
    # 1. NORMALIZE the filename to find a match
    # Example: 'npcchh_health_guidelines.pdf' -> 'npcchh_health_guidelines'
    clean_target = file_name.lower().replace(".pdf", "").replace(".md", "").strip()
    
    match = None
    # Check for direct inclusion (most reliable)
    for f in all_files:
        if clean_target in f.lower():
            match = f
            break
            
    if not match:
        # Fallback to fuzzy matching
        matches = difflib.get_close_matches(clean_target, all_files, n=1, cutoff=0.2)
        if matches: match = matches[0]

    if not match:
        print(f"❌ Librarian failed to find a match for: {file_name}")
        return ""

    print(f"✅ Librarian successfully opened: {match}")

    try:
        with open(os.path.join(STORAGE_ROOT, match), "r", encoding="utf-8") as f:
            content = f.read()
        
        extracted_text = ""
        # Ensure target_pages is a list
        if isinstance(target_pages, int): target_pages = [target_pages]
        
        for page_num in target_pages:
            # Use word-boundary-safe marker: must be followed by newline, not another digit
            pattern = rf"## Page {page_num}(?!\d)"
            m = re.search(pattern, content)
            if not m:
                continue
            start_idx = m.start()

            # Find the next page marker (any page number) after this one
            next_m = re.search(r"## Page \d+", content[start_idx + len(m.group()):])
            if next_m:
                end_idx = start_idx + len(m.group()) + next_m.start()
            else:
                end_idx = len(content)

            extracted_text += f"\n--- Content from {match} Page {page_num} ---\n"
            extracted_text += content[start_idx:end_idx][:3500]
        
        return extracted_text
    except Exception as e:
        print(f"❌ Error reading {match}: {e}")
        return ""

# 3. THE MAIN ENDPOINT
@app.post("/chat")
async def chat_with_policy(request: ChatRequest):

    # --- PRE-FLIGHT: CLASSIFY THE QUERY ---
    classification = classify_query(request.query)
    query_type = classification.get("type", "policy")

    # Off-topic — decline immediately, no RAG
    if query_type == "offtopic":
        return {
            "answer": "I'm Clarity.AI, focused on Indian environmental policy, pollution standards, and related regulations. I can't help with that, but feel free to ask me about air quality norms, CPCB penalties, waste management rules, or climate health guidelines.",
            "sources": []
        }

    # General science — answer directly from LLM, no document lookup needed
    if query_type == "science":
        science_resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": """You are an environmental science expert assistant. 
Answer general environmental and scientific questions clearly and concisely.
Keep answers to 3-5 sentences. Use plain language.
If the question has a specific Indian policy angle (e.g. Indian standards for this pollutant), 
mention that the user can ask you about the official Indian regulations too."""},
                {"role": "user", "content": request.query}
            ],
            model=MODEL_NAME
        )
        return {
            "answer": science_resp.choices[0].message.content,
            "sources": []
        }

    # policy → fall through to full RAG pipeline below
    # --- A. PREPARE THE SLIM MAP ---
    available_trees = [f for f in os.listdir(STORAGE_ROOT) if f.endswith("_tree.json")]
    if not available_trees:
        return {"answer": "The library is currently empty."}

    
    # --- A. PREPARE THE SLIM MAP (Smart Sampling) ---
    slim_maps = []
    for tree_file in available_trees:
        try:
            with open(os.path.join(STORAGE_ROOT, tree_file), "r", encoding="utf-8") as f:
                tree = json.load(f)
                all_structure = tree.get("structure", [])
                
                # Sample: first 3 pages + every 15th page, max 8 hints, 1 keyword each
                page_hints = []
                for idx, s in enumerate(all_structure):
                    if idx < 3 or idx % 15 == 0:
                        page_hints.append({
                            "p": s.get("page"),
                            "k": s.get("keywords", [])[:1]
                        })
                    if len(page_hints) >= 8:
                        break

                slim_maps.append({
                    "f": tree.get("document", tree_file)[:30],
                    "h": page_hints
                })
        except: continue
    
    # Show all documents to the Librarian — capping causes misses on larger libraries
    # slim_maps = slim_maps[:5]

    # --- B. STEP 1a: FILE SELECTION (pick the right doc from names only) ---
    doc_list = [{"f": m["f"], "p1k": m["h"][0]["k"] if m["h"] else []} for m in slim_maps]

    file_select_prompt = f"""
    You are a document router for an Indian Environmental Policy database.
    Question: {request.query}

    Available documents (f=filename, p1k=page1 keywords):
    {json.dumps(doc_list)}

    Return ONLY JSON with the 1-2 most relevant filenames:
    {{"files": ["exact_filename.pdf"]}}
    """

    file_resp = client.chat.completions.create(
        messages=[{"role": "user", "content": file_select_prompt}],
        model=MODEL_NAME,
        response_format={"type": "json_object"}
    )
    selected_files = json.loads(file_resp.choices[0].message.content).get("files", [])
    # Normalize: handle cases where LLM returns list of dicts instead of strings
    normalized = []
    for f in selected_files:
        if isinstance(f, str):
            normalized.append(f)
        elif isinstance(f, dict):
            # grab whatever value looks like a filename
            for v in f.values():
                if isinstance(v, str):
                    normalized.append(v)
                    break
    selected_files = normalized

    # --- B. STEP 1b: PAGE SELECTION (use full hints of selected docs only) ---
    selected_maps = [m for m in slim_maps if any(sf.lower().replace(".pdf","") in m["f"].lower() for sf in selected_files)]
    if not selected_maps:
        selected_maps = slim_maps[:2]  # fallback

    page_select_prompt = f"""
    You are a page navigator for Indian Environmental Policy documents.
    Question: {request.query}

    Selected document hints (p=page, k=keywords):
    {json.dumps(selected_maps)}

    Pick the 3-5 most relevant pages. Return ONLY JSON:
    {{"sources": [{{"file_name": "exact_filename.pdf", "pages": [10, 11, 12]}}]}}
    """

    path_resp = client.chat.completions.create(
        messages=[{"role": "user", "content": page_select_prompt}],
        model=MODEL_NAME,
        response_format={"type": "json_object"}
    )
        
    try:
        raw_nav = json.loads(path_resp.choices[0].message.content)
        nav_list = raw_nav.get("sources", [raw_nav] if isinstance(raw_nav, dict) else [])

        # --- C. STEP 2: EXTRACTION ---
        full_context = ""
        sources_used = []
        for nav in nav_list[:2]:
            fname = nav.get("file_name")
            pages = nav.get("pages", [1])
            if fname:
                text = get_relevant_md_content(fname, pages)
                if text:
                    full_context += text
                    sources_used.append(f"{fname} (Pages: {pages})")

        if not full_context:
            return {"answer": "I found the relevant documents, but I couldn't extract the specific page text. Please try re-indexing."}

        # --- D. STEP 3: FINAL ANSWER (THE EXPERT) ---
        final_resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": """You are the 'Clarity.AI Expert' on Indian Environmental Policy.

INTERNAL PROCESSING (do this silently, never show it in your response):
- PDF-extracted tables often split one logical row across two physical rows when a cell was too long.
- Before answering, mentally reconstruct split rows by combining incomplete pollutant names with their continuation row.
- Common splits: "Particulate Matter (size less than 2.5" + "microns) or PM" = PM2.5. "Particulate Matter (size less than 10 μm) or" + next row = PM10.
- Match abbreviations to full names: PM2.5, PM10, SO2, NO2, CO, O3.

OUTPUT RULES (this is what the user sees):
- Give a direct, clean answer in 2-4 sentences maximum.
- Always include the specific number with units (e.g. 40 µg/m³).
- End with one line: "Source: [filename], Page [n]"
- Do NOT show tables, do NOT show your reconstruction process, do NOT repeat the question back."""},
                {"role": "user", "content": f"Context:\n{full_context}\n\nQuestion: {request.query}"}
            ],
            model=MODEL_NAME
        )
        
        return {
            "answer": final_resp.choices[0].message.content,
            "sources": sources_used
        }

    except Exception as e:
        print(f"System Error: {e}")
        raise HTTPException(status_code=500, detail="The AI Librarian encountered an error processing the request.")

# 4. RUNNER
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)