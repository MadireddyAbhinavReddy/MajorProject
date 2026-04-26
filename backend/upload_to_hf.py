"""
Upload cpcb_hyderabad CSVs to Hugging Face — skips already uploaded files.

Usage:
    python3 upload_to_hf.py --username YOUR_HF_USERNAME
"""

import os
import sys
import glob
import time
import argparse
from dotenv import load_dotenv
from huggingface_hub import HfApi, create_repo

load_dotenv()

HF_TOKEN  = os.getenv("HF_TOKEN_UPLOAD") or os.getenv("HF_TOKEN")
CPCB_DIR  = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "cpcb_hyderabad")
REPO_NAME = "cpcb-hyderabad"


def get_uploaded_files(api, repo_id):
    """Get set of filenames already in the repo."""
    try:
        files = api.list_repo_files(repo_id=repo_id, repo_type="dataset", token=HF_TOKEN)
        return set(files)
    except Exception:
        return set()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", required=True)
    args = parser.parse_args()

    repo_id = f"{args.username}/{REPO_NAME}"

    if not HF_TOKEN:
        print("ERROR: HF_TOKEN not found in .env")
        sys.exit(1)

    api = HfApi(token=HF_TOKEN)

    # Create repo if needed
    create_repo(repo_id=repo_id, repo_type="dataset", private=True, token=HF_TOKEN, exist_ok=True)
    print(f"Repo: {repo_id}")

    # Get already uploaded files
    print("Checking already uploaded files...")
    uploaded = get_uploaded_files(api, repo_id)
    print(f"Already uploaded: {len(uploaded)} files")

    csv_files = sorted(glob.glob(os.path.join(CPCB_DIR, "*.csv")))
    remaining = [f for f in csv_files if os.path.basename(f) not in uploaded]
    print(f"Remaining to upload: {len(remaining)} / {len(csv_files)} files\n")

    if not remaining:
        print("All files already uploaded!")
        return

    failed = []
    for i, path in enumerate(remaining, 1):
        fname = os.path.basename(path)
        print(f"[{i}/{len(remaining)}] {fname} ...", end=" ", flush=True)

        # Retry up to 3 times with backoff
        for attempt in range(3):
            try:
                api.upload_file(
                    path_or_fileobj=path,
                    path_in_repo=fname,
                    repo_id=repo_id,
                    repo_type="dataset",
                    token=HF_TOKEN,
                )
                print("✓")
                time.sleep(0.5)  # small delay to avoid hammering the API
                break
            except Exception as e:
                err = str(e)
                if "429" in err:
                    print(f"\n⏳ Rate limited — waiting 60 seconds...")
                    time.sleep(60)
                elif attempt < 2:
                    print(f"retrying ({attempt+1})...", end=" ", flush=True)
                    time.sleep(3)
                else:
                    print(f"✗ FAILED: {err[:80]}")
                    failed.append(fname)

    print(f"\n{'='*50}")
    print(f"Done. {len(remaining) - len(failed)}/{len(remaining)} uploaded successfully.")
    if failed:
        print(f"Failed ({len(failed)}):")
        for f in failed:
            print(f"  - {f}")
        print("Run the script again to retry failed files.")


if __name__ == "__main__":
    main()
