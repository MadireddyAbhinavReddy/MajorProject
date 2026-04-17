import os
import re
import json
import difflib
import uvicorn
import glob as glob_module
import pandas as pd
from functools import lru_cache
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from groq import Groq
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# ── Setup ─────────────────────────────────────────────────────────────────────
load_dotenv()
app = FastAPI(title="Clarity.AI — AQI + Policy Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
STORAGE_ROOT = "./storage"
MODEL_NAME   = "llama-3.1-8b-instant"

# ── Zone metadata ─────────────────────────────────────────────────────────────
ZONE_LABELS = {
    "hyd-somajiguda-tspcb-2024-25":               "Somajiguda",
    "hyd-kompally-municipal-office-tspcb-2024-25": "Kompally",
    "hyd-iith-kandi-tspcb-2024-25":               "IITH Kandi",
    "hyd-icrisat-patancheru-tspcb-2024-25":        "ICRISAT Patancheru",
    "hyd-ida-pashamylaram-tspcb-2024-25":          "IDA Pashamylaram",
    "hyd-central-university-tspcb-2024-25":        "Central University",
    "hyd-zoo-park-tspcb-2024-25":                  "Zoo Park",
}

ZONE_COORDS = {
    "hyd-somajiguda-tspcb-2024-25":               {"lat": 17.4239, "lng": 78.4738},
    "hyd-kompally-municipal-office-tspcb-2024-25": {"lat": 17.5406, "lng": 78.4867},
    "hyd-iith-kandi-tspcb-2024-25":               {"lat": 17.5936, "lng": 78.1320},
    "hyd-icrisat-patancheru-tspcb-2024-25":        {"lat": 17.5169, "lng": 78.2674},
    "hyd-ida-pashamylaram-tspcb-2024-25":          {"lat": 17.5169, "lng": 78.2674},
    "hyd-central-university-tspcb-2024-25":        {"lat": 17.4586, "lng": 78.3318},
    "hyd-zoo-park-tspcb-2024-25":                  {"lat": 17.3616, "lng": 78.4513},
}

# ── Policy dashboard config ───────────────────────────────────────────────────
CPCB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "cpcb_hyderabad")

CORE_STATIONS = {
    "Somajiguda":         "Somajiguda_ Hyderabad - TSPCB_2025.csv",
    "Kompally":           "Kompally Municipal Office_ Hyderabad - TSPCB_2025.csv",
    "IITH Kandi":         "IITH Kandi_ Hyderabad - TSPCB_2025.csv",
    "ICRISAT Patancheru": "ICRISAT Patancheru_ Hyderabad - TSPCB_2025.csv",
    "IDA Pashamylaram":   "IDA Pashamylaram_ Hyderabad - TSPCB_2025.csv",
    "Central University": "Central University_ Hyderabad - TSPCB_2025.csv",
    "Zoo Park":           "Zoo Park_ Hyderabad - TSPCB_2025.csv",
}

EXTRA_STATIONS = {
    "Bollaram Industrial": "Bollaram Industrial Area_ Hyderabad - TSPCB_2025.csv",
    "ECIL Kapra":          "ECIL Kapra_ Hyderabad - TSPCB_2025.csv",
    "Kokapet":             "Kokapet_ Hyderabad - TSPCB_2025.csv",
    "Nacharam TSIIC":      "Nacharam_TSIIC IALA_ Hyderabad - TSPCB_2025.csv",
    "New Malakpet":        "New Malakpet_ Hyderabad - TSPCB_2025.csv",
    "Ramachandrapuram":    "Ramachandrapuram_ Hyderabad - TSPCB_2025.csv",
    "Sanathnagar":         "Sanathnagar_ Hyderabad - TSPCB_2025.csv",
}

COL_MAP = {
    "PM2.5 (µg/m³)": "pm2_5", "PM10 (µg/m³)": "pm10",
    "NO2 (µg/m³)": "no2",     "SO2 (µg/m³)": "so2",
    "CO (mg/m³)": "co",        "Ozone (µg/m³)": "ozone",
    "NO (µg/m³)": "no",        "NOx (ppb)": "nox",
    "NH3 (µg/m³)": "nh3",      "Benzene (µg/m³)": "benzene",
    "Toluene (µg/m³)": "toluene", "Xylene (µg/m³)": "xylene",
    "AT (°C)": "temp",         "RH (%)": "humidity",
    "WS (m/s)": "wind_speed",  "WD (deg)": "wind_dir",
    "SR (W/mt2)": "solar_rad", "RF (mm)": "rain_fall",
}

STATION_PREFIX_MAP = {k: v.replace("_2025.csv", "") for k, v in CORE_STATIONS.items()}

NEON_URL = "postgresql://neondb_owner:npg_BKeulphnN0I2@ep-withered-moon-a169dqm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ── Helpers ───────────────────────────────────────────────────────────────────
def compute_aqi(pm25: float) -> int:
    breakpoints = [
        (0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400), (350.5, 500.4, 401, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm25 <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo)
    return 500


def get_neon_conn():
    import psycopg2
    return psycopg2.connect(NEON_URL)


@lru_cache(maxsize=20)
def load_station_csv(label: str, resample: str = "1D", year: int = 2025):
    all_stations = {**CORE_STATIONS, **EXTRA_STATIONS}
    fname_2025 = all_stations.get(label)
    if not fname_2025:
        return None
    fname = fname_2025.replace("_2025.csv", f"_{year}.csv")
    path  = os.path.join(CPCB_DIR, fname)
    if not os.path.exists(path):
        return None
    df = pd.read_csv(path, parse_dates=["Timestamp"])
    df = df.rename(columns={"Timestamp": "timestamp", **COL_MAP})
    df = df.set_index("timestamp")
    df = df.select_dtypes(include="number").resample(resample).mean().reset_index()
    df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%d")
    for c in df.select_dtypes(include="number").columns:
        df[c] = df[c].round(2)
    return df.dropna(how="all", subset=[c for c in df.columns if c != "timestamp"]).replace({float("nan"): None})


@lru_cache(maxsize=10)
def load_multiyear(station: str, resample: str = "ME") -> pd.DataFrame:
    prefix = STATION_PREFIX_MAP.get(station)
    if not prefix:
        return pd.DataFrame()
    dfs = []
    for year in range(2017, 2026):
        path = os.path.join(CPCB_DIR, f"{prefix}_{year}.csv")
        if not os.path.exists(path):
            continue
        try:
            df = pd.read_csv(path, parse_dates=["Timestamp"])
            df = df.rename(columns={"Timestamp": "timestamp", **COL_MAP})
            dfs.append(df)
        except Exception:
            continue
    if not dfs:
        return pd.DataFrame()
    combined  = pd.concat(dfs, ignore_index=True).set_index("timestamp")
    available = [c for c in COL_MAP.values() if c in combined.columns]
    resampled = combined[available].resample(resample).mean().reset_index()
    resampled["timestamp"] = resampled["timestamp"].dt.strftime("%Y-%m-%d")
    for c in resampled.select_dtypes(include="number").columns:
        resampled[c] = resampled[c].round(2)
    return resampled.dropna(how="all", subset=available).replace({float("nan"): None})


# ── Live Neon DB endpoints ────────────────────────────────────────────────────
@app.get("/live/latest")
def get_live_latest():
    try:
        conn = get_neon_conn()
        cur  = conn.cursor()
        cur.execute("SELECT DISTINCT ON (zone_id) * FROM aqi_measurements_live ORDER BY zone_id, timestamp DESC")
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
        conn.close()
        result = []
        for row in rows:
            d    = dict(zip(cols, row))
            pm25 = float(d["pm2_5"]) if d["pm2_5"] is not None else 0
            d["aqi"]       = compute_aqi(pm25)
            d["label"]     = ZONE_LABELS.get(d["zone_id"], d["zone_id"])
            d["lat"]       = ZONE_COORDS.get(d["zone_id"], {}).get("lat", 17.38)
            d["lng"]       = ZONE_COORDS.get(d["zone_id"], {}).get("lng", 78.48)
            d["timestamp"] = d["timestamp"].isoformat() if d["timestamp"] else None
            for k, v in d.items():
                if isinstance(v, float):
                    d[k] = round(v, 3)
            result.append(d)
        return result
    except Exception as e:
        return {"error": str(e)}


@app.get("/live/history")
def get_live_history(zone_id: str = Query(...), limit: int = Query(default=100, le=1000)):
    try:
        conn = get_neon_conn()
        cur  = conn.cursor()
        cur.execute("""
            SELECT timestamp, zone_id, pm2_5, pm10, no2, so2, co, ozone,
                   temp, humidity, wind_speed, no, nox, nh3,
                   benzene, toluene, xylene, wind_dir, solar_rad, rain_fall
            FROM aqi_measurements_live WHERE zone_id = %s
            ORDER BY timestamp DESC LIMIT %s
        """, (zone_id, limit))
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
        conn.close()
        result = []
        for row in rows:
            d    = dict(zip(cols, row))
            pm25 = float(d["pm2_5"]) if d["pm2_5"] is not None else 0
            d["aqi"]       = compute_aqi(pm25)
            d["timestamp"] = d["timestamp"].isoformat() if d["timestamp"] else None
            for k, v in d.items():
                if isinstance(v, float):
                    d[k] = round(v, 3)
            result.append(d)
        return list(reversed(result))
    except Exception as e:
        return {"error": str(e)}


# ── Policy data endpoints ─────────────────────────────────────────────────────
@app.get("/policy/stations")
def get_policy_stations():
    return {"core": list(CORE_STATIONS.keys()), "extra": list(EXTRA_STATIONS.keys())}


@app.get("/policy/years")
def get_policy_years(station: str = Query(...)):
    all_stations = {**CORE_STATIONS, **EXTRA_STATIONS}
    fname_2025   = all_stations.get(station)
    if not fname_2025:
        return []
    years = []
    for y in range(2009, 2026):
        fname = fname_2025.replace("_2025.csv", f"_{y}.csv")
        if os.path.exists(os.path.join(CPCB_DIR, fname)):
            years.append(y)
    return sorted(years, reverse=True)


@app.get("/policy/data")
def get_policy_data(station: str = Query(...), resample: str = Query(default="1D"), year: int = Query(default=2025)):
    df = load_station_csv(station, resample, year)
    if df is None:
        return {"error": f"Station '{station}' not found"}
    return df.to_dict(orient="records")


@app.get("/trends/data")
def get_trends(station: str = Query(...), resample: str = Query(default="ME")):
    df = load_multiyear(station, resample)
    if df.empty:
        return {"error": f"No multi-year data for '{station}'"}
    return df.to_dict(orient="records")


# ── Prediction endpoint ───────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    timestamp: str
    zone_id: str
    target: str
    known: Optional[dict] = {}


@app.post("/predict")
def predict_pollutant(req: PredictRequest):
    from predictor import predict
    return predict(timestamp=req.timestamp, zone_id=req.zone_id, known=req.known, target=req.target)


@app.get("/predict/columns")
def get_predictable_columns():
    return {
        "pollutants": ["pm2_5","pm10","no2","so2","co","ozone","no","nox","nh3","benzene","toluene","xylene"],
        "meteorology": ["temp","humidity","wind_speed","wind_dir","solar_rad","rain_fall"],
        "zones": list(ZONE_LABELS.keys()),
    }


# ── Forecast endpoint ─────────────────────────────────────────────────────────
class ForecastRequest(BaseModel):
    station: str
    pollutant: str = "pm2_5"
    policy_start: str = "2020-03-25"
    policy_end: str   = "2020-06-30"
    forecast_days: int = 90


@app.post("/forecast/policy")
def forecast_policy_impact(req: ForecastRequest):
    from forecaster import run_forecast
    return run_forecast(station=req.station, pollutant=req.pollutant,
                        policy_start=req.policy_start, policy_end=req.policy_end,
                        forecast_days=req.forecast_days)


# ── Chatbot (Groq + RAG) ──────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str


def classify_query(query: str) -> dict:
    resp = client.chat.completions.create(
        messages=[{"role": "user", "content": f"""Classify this query for an Indian Environmental Policy assistant.
Categories: "policy" (Indian env law/regulations/standards/AQI), "science" (general env science), "offtopic" (unrelated).
Query: "{query}"
Return ONLY JSON: {{"type": "policy"|"science"|"offtopic", "reason": "one sentence"}}"""}],
        model=MODEL_NAME, response_format={"type": "json_object"}
    )
    try:
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {"type": "policy", "reason": "classification failed"}


def get_relevant_md_content(file_name: str, target_pages) -> str:
    if not os.path.exists(STORAGE_ROOT):
        return ""
    all_files   = [f for f in os.listdir(STORAGE_ROOT) if f.endswith(".md")]
    clean_target = file_name.lower().replace(".pdf", "").replace(".md", "").strip()
    match = next((f for f in all_files if clean_target in f.lower()), None)
    if not match:
        matches = difflib.get_close_matches(clean_target, all_files, n=1, cutoff=0.2)
        match   = matches[0] if matches else None
    if not match:
        return ""
    try:
        with open(os.path.join(STORAGE_ROOT, match), "r", encoding="utf-8") as f:
            content = f.read()
        if isinstance(target_pages, int):
            target_pages = [target_pages]
        extracted = ""
        for page_num in target_pages:
            m = re.search(rf"## Page {page_num}(?!\d)", content)
            if not m:
                continue
            start  = m.start()
            next_m = re.search(r"## Page \d+", content[start + len(m.group()):])
            end    = start + len(m.group()) + next_m.start() if next_m else len(content)
            extracted += f"\n--- {match} Page {page_num} ---\n{content[start:end][:3500]}"
        return extracted
    except Exception:
        return ""


@app.post("/chat")
async def chat_with_policy(request: ChatRequest):
    classification = classify_query(request.query)
    query_type     = classification.get("type", "policy")

    if query_type == "offtopic":
        return {"answer": "I'm Clarity.AI, focused on Indian environmental policy and air quality. Ask me about AQI standards, CPCB regulations, pollution sources, or health guidelines.", "sources": []}

    if query_type == "science":
        resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an environmental science expert. Answer clearly in 3-5 sentences."},
                {"role": "user", "content": request.query}
            ], model=MODEL_NAME
        )
        return {"answer": resp.choices[0].message.content, "sources": []}

    # Policy — RAG pipeline
    available_trees = []
    if os.path.exists(STORAGE_ROOT):
        available_trees = [f for f in os.listdir(STORAGE_ROOT) if f.endswith("_tree.json")]

    if not available_trees:
        resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an Indian environmental policy expert. Answer based on CPCB, NAAQS, and Indian pollution regulations."},
                {"role": "user", "content": request.query}
            ], model=MODEL_NAME
        )
        return {"answer": resp.choices[0].message.content, "sources": []}

    slim_maps = []
    for tree_file in available_trees:
        try:
            with open(os.path.join(STORAGE_ROOT, tree_file), "r", encoding="utf-8") as f:
                tree = json.load(f)
            hints = [{"p": s.get("page"), "k": s.get("keywords", [])[:1]}
                     for i, s in enumerate(tree.get("structure", [])) if i < 3 or i % 15 == 0][:8]
            slim_maps.append({"f": tree.get("document", tree_file)[:30], "h": hints})
        except Exception:
            continue

    doc_list  = [{"f": m["f"], "p1k": m["h"][0]["k"] if m["h"] else []} for m in slim_maps]
    file_resp = client.chat.completions.create(
        messages=[{"role": "user", "content": f'Question: {request.query}\nDocs: {json.dumps(doc_list)}\nReturn JSON: {{"files": ["filename.pdf"]}}'}],
        model=MODEL_NAME, response_format={"type": "json_object"}
    )
    selected_files = json.loads(file_resp.choices[0].message.content).get("files", [])
    selected_files = [f if isinstance(f, str) else list(f.values())[0] for f in selected_files if f]

    selected_maps = [m for m in slim_maps if any(sf.lower().replace(".pdf","") in m["f"].lower() for sf in selected_files)] or slim_maps[:2]
    page_resp = client.chat.completions.create(
        messages=[{"role": "user", "content": f'Question: {request.query}\nHints: {json.dumps(selected_maps)}\nReturn JSON: {{"sources": [{{"file_name": "f.pdf", "pages": [1,2]}}]}}'}],
        model=MODEL_NAME, response_format={"type": "json_object"}
    )

    try:
        nav_list     = json.loads(page_resp.choices[0].message.content).get("sources", [])
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
            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an Indian environmental policy expert."},
                    {"role": "user", "content": request.query}
                ], model=MODEL_NAME
            )
            return {"answer": resp.choices[0].message.content, "sources": []}

        final_resp = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are Clarity.AI, an Indian Environmental Policy expert. Answer in 2-4 sentences with specific numbers and units. End with 'Source: [filename], Page [n]'."},
                {"role": "user", "content": f"Context:\n{full_context}\n\nQuestion: {request.query}"}
            ], model=MODEL_NAME
        )
        return {"answer": final_resp.choices[0].message.content, "sources": sources_used}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Runner ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
