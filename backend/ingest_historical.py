"""
One-time ingestion script — uploads all cpcb_hyderabad CSVs to Supabase.

Run from the backend folder:
    python ingest_historical.py

Or with a dry run to check file discovery:
    python ingest_historical.py --dry-run
"""

import os
import sys
import glob
import psycopg2
import psycopg2.extras
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_DB_URL")
if not SUPABASE_URL or "[YOUR-PASSWORD]" in SUPABASE_URL:
    print("ERROR: Set SUPABASE_DB_URL in .env with your real password first.")
    sys.exit(1)

CPCB_DIR   = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "cpcb_hyderabad")
BATCH_SIZE = 5000

COL_MAP = {
    "PM2.5 (µg/m³)": "pm2_5",   "PM10 (µg/m³)":  "pm10",
    "NO2 (µg/m³)":   "no2",     "SO2 (µg/m³)":   "so2",
    "CO (mg/m³)":    "co",      "Ozone (µg/m³)": "ozone",
    "NO (µg/m³)":    "no",      "NOx (ppb)":     "nox",
    "NH3 (µg/m³)":   "nh3",     "Benzene (µg/m³)": "benzene",
    "Toluene (µg/m³)": "toluene", "Xylene (µg/m³)": "xylene",
    "AT (°C)":       "temp",    "RH (%)":        "humidity",
    "WS (m/s)":      "wind_speed", "WD (deg)":   "wind_dir",
    "SR (W/mt2)":    "solar_rad",  "RF (mm)":    "rain_fall",
}

DATA_COLS = list(COL_MAP.values())

# ── Helpers ───────────────────────────────────────────────────────────────────
def station_name_from_path(path: str) -> str:
    """Extract clean station name from filename, e.g. 'Somajiguda_ Hyderabad - TSPCB_2021.csv' → 'Somajiguda'"""
    fname = os.path.basename(path)
    # Remove year suffix and extension
    name = fname.rsplit("_", 1)[0]          # 'Somajiguda_ Hyderabad - TSPCB'
    name = name.split("_ Hyderabad")[0]     # 'Somajiguda'
    return name.strip()


def already_ingested(cur, station: str, year: int) -> bool:
    cur.execute(
        "SELECT 1 FROM cpcb_historical WHERE station = %s AND EXTRACT(YEAR FROM timestamp) = %s LIMIT 1",
        (station, year)
    )
    return cur.fetchone() is not None


def ingest_file(cur, path: str, dry_run: bool = False) -> int:
    station = station_name_from_path(path)
    year    = int(path.rsplit("_", 1)[1].replace(".csv", ""))

    if not dry_run and already_ingested(cur, station, year):
        print(f"  ⏭  Skipping {os.path.basename(path)} — already in DB")
        return 0

    try:
        df = pd.read_csv(path, parse_dates=["Timestamp"])
    except Exception as e:
        print(f"  ✗  Failed to read {os.path.basename(path)}: {e}")
        return 0

    df = df.rename(columns={"Timestamp": "timestamp", **COL_MAP})
    df["station"] = station

    # Keep only known columns
    keep = ["station", "timestamp"] + [c for c in DATA_COLS if c in df.columns]
    df   = df[keep].dropna(subset=["timestamp"])

    # Replace NaN with None for psycopg2
    df = df.where(pd.notnull(df), None)

    rows = df.to_dict(orient="records")
    if dry_run:
        print(f"  [DRY RUN] {os.path.basename(path)} → {len(rows)} rows, station='{station}'")
        return len(rows)

    # Build INSERT with all possible data columns
    all_data_cols = [c for c in DATA_COLS if c in df.columns]
    col_names     = ["station", "timestamp"] + all_data_cols
    placeholders  = ", ".join(["%s"] * len(col_names))
    col_str       = ", ".join(col_names)
    sql = f"""
        INSERT INTO cpcb_historical ({col_str})
        VALUES ({placeholders})
        ON CONFLICT DO NOTHING
    """

    inserted = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        values = [[r.get(c) for c in col_names] for r in batch]
        psycopg2.extras.execute_batch(cur, sql, values, page_size=BATCH_SIZE)
        inserted += len(batch)

    return inserted


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    dry_run = "--dry-run" in sys.argv

    if not os.path.isdir(CPCB_DIR):
        print(f"ERROR: cpcb_hyderabad directory not found at: {CPCB_DIR}")
        sys.exit(1)

    csv_files = sorted(glob.glob(os.path.join(CPCB_DIR, "*.csv")))
    print(f"Found {len(csv_files)} CSV files in {CPCB_DIR}")

    if dry_run:
        print("── DRY RUN MODE — no data will be written ──")
        for path in csv_files:
            ingest_file(None, path, dry_run=True)
        return

    print(f"Connecting to Supabase...")
    conn = psycopg2.connect(SUPABASE_URL)
    conn.autocommit = False
    cur  = conn.cursor()

    total_inserted = 0
    total_files    = len(csv_files)

    for i, path in enumerate(csv_files, 1):
        fname = os.path.basename(path)
        print(f"[{i}/{total_files}] {fname}", end=" ... ", flush=True)
        try:
            n = ingest_file(cur, path)
            conn.commit()
            total_inserted += n
            print(f"✓ {n} rows")
        except Exception as e:
            conn.rollback()
            print(f"✗ ERROR: {e}")

    cur.close()
    conn.close()
    print(f"\nDone. Total rows inserted: {total_inserted:,}")
    print(f"Finished at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
