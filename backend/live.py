from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import os
from functools import lru_cache

app = FastAPI(title="AQI Data API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.on_event("startup")
# async def startup_event():
#     from predictor import warmup
#     import asyncio
#     loop = asyncio.get_event_loop()
#     loop.run_in_executor(None, warmup)

# CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "aqi_data.csv")  # unused — using Neon DB now

# Zone display name mapping
ZONE_LABELS = {
    "hyd-somajiguda-tspcb-2024-25": "Somajiguda",
    "hyd-kompally-municipal-office-tspcb-2024-25": "Kompally",
    "hyd-iith-kandi-tspcb-2024-25": "IITH Kandi",
    "hyd-icrisat-patancheru-tspcb-2024-25": "ICRISAT Patancheru",
    "hyd-ida-pashamylaram-tspcb-2024-25": "IDA Pashamylaram",
    "hyd-central-university-tspcb-2024-25": "Central University",
    "hyd-zoo-park-tspcb-2024-25": "Zoo Park",
}

# Approximate lat/lng for each zone
ZONE_COORDS = {
    "hyd-somajiguda-tspcb-2024-25":               {"lat": 17.4239, "lng": 78.4738},
    "hyd-kompally-municipal-office-tspcb-2024-25": {"lat": 17.5406, "lng": 78.4867},
    "hyd-iith-kandi-tspcb-2024-25":               {"lat": 17.5936, "lng": 78.1320},
    "hyd-icrisat-patancheru-tspcb-2024-25":        {"lat": 17.5169, "lng": 78.2674},
    "hyd-ida-pashamylaram-tspcb-2024-25":          {"lat": 17.5169, "lng": 78.2674},
    "hyd-central-university-tspcb-2024-25":        {"lat": 17.4586, "lng": 78.3318},
    "hyd-zoo-park-tspcb-2024-25":                  {"lat": 17.3616, "lng": 78.4513},
}


# @lru_cache(maxsize=1)
# def load_data() -> pd.DataFrame:
#     print("Loading CSV into memory...")
#     df = pd.read_csv(CSV_PATH, parse_dates=["timestamp"])
#     df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
#     df = df.set_index("timestamp")
#     df = df.groupby("zone_id").resample("1min").mean(numeric_only=True).reset_index()
#     print(f"Loaded {len(df):,} rows (1-min resampled)")
#     return df


def compute_aqi(pm25: float) -> int:
    """Simple AQI from PM2.5 using US EPA breakpoints."""
    breakpoints = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm25 <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo)
    return 500


# ── Routes ────────────────────────────────────────────────────────────────────

# ── Old CSV-based endpoints (commented out — using Neon DB now) ───────────────

# @app.get("/zones")
# def get_zones(): ...

# @app.get("/zone/{zone_id}/latest")
# def get_zone_latest(zone_id: str): ...

# @app.get("/zone/{zone_id}/history")
# def get_zone_history(zone_id: str, hours: int = Query(default=24)): ...

# @app.get("/forecast/{zone_id}")
# def get_forecast(zone_id: str): ...

# @app.get("/summary")
# def get_summary(): ...

# ── Prediction endpoint ───────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    timestamp: str                          # e.g. "2025-01-10 14:30:00"
    zone_id: str                            # e.g. "hyd-somajiguda-tspcb-2024-25"
    target: str                             # column to predict e.g. "pm10"
    known: Optional[dict] = {}             # known values e.g. {"pm2_5": 45.0, "temp": 22.0}


@app.post("/predict")
def predict_pollutant(req: PredictRequest):
    """
    Predict a pollutant/met value using TabPFN given timestamp + known inputs.
    """
    from predictor import predict
    return predict(
        timestamp=req.timestamp,
        zone_id=req.zone_id,
        known=req.known,
        target=req.target,
    )


@app.get("/predict/columns")
def get_predictable_columns():
    """List all columns that can be used as input or predicted."""
    return {
        "pollutants": ["pm2_5", "pm10", "no2", "so2", "co", "ozone",
                       "no", "nox", "nh3", "benzene", "toluene", "xylene"],
        "meteorology": ["temp", "humidity", "wind_speed", "wind_dir", "solar_rad", "rain_fall"],
        "zones": list(ZONE_LABELS.keys()),
    }


# ── Neon Live DB endpoints ────────────────────────────────────────────────────

NEON_URL = "postgresql://neondb_owner:npg_BKeulphnN0I2@ep-withered-moon-a169dqm7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_neon_conn():
    import psycopg2
    return psycopg2.connect(NEON_URL)


@app.get("/live/latest")
def get_live_latest():
    """Latest reading per zone from the live Neon table."""
    try:
        conn = get_neon_conn()
        cur  = conn.cursor()
        cur.execute("""
            SELECT DISTINCT ON (zone_id) *
            FROM aqi_measurements_live
            ORDER BY zone_id, timestamp DESC
        """)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
        conn.close()

        result = []
        for row in rows:
            d = dict(zip(cols, row))
            pm25 = float(d["pm2_5"]) if d["pm2_5"] is not None else 0
            d["aqi"]   = compute_aqi(pm25)
            d["label"] = ZONE_LABELS.get(d["zone_id"], d["zone_id"])
            d["lat"]   = ZONE_COORDS.get(d["zone_id"], {}).get("lat", 17.38)
            d["lng"]   = ZONE_COORDS.get(d["zone_id"], {}).get("lng", 78.48)
            d["timestamp"] = d["timestamp"].isoformat() if d["timestamp"] else None
            # round floats
            for k, v in d.items():
                if isinstance(v, float):
                    d[k] = round(v, 3)
            result.append(d)
        return result

    except Exception as e:
        return {"error": str(e)}


@app.get("/live/history")
def get_live_history(zone_id: str = Query(...), limit: int = Query(default=100, le=1000)):
    """Recent readings for a zone from the live table."""
    try:
        conn = get_neon_conn()
        cur  = conn.cursor()
        cur.execute("""
            SELECT timestamp, zone_id, pm2_5, pm10, no2, so2, co, ozone,
                   temp, humidity, wind_speed, no, nox, nh3,
                   benzene, toluene, xylene, wind_dir, solar_rad, rain_fall
            FROM aqi_measurements_live
            WHERE zone_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """, (zone_id, limit))
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
        conn.close()

        result = []
        for row in rows:
            d = dict(zip(cols, row))
            pm25 = float(d["pm2_5"]) if d["pm2_5"] is not None else 0
            d["aqi"] = compute_aqi(pm25)
            d["timestamp"] = d["timestamp"].isoformat() if d["timestamp"] else None
            for k, v in d.items():
                if isinstance(v, float):
                    d[k] = round(v, 3)
            result.append(d)
        return list(reversed(result))  # chronological order

    except Exception as e:
        return {"error": str(e)}


# ── Policy Dashboard endpoints ────────────────────────────────────────────────

import glob as glob_module

CPCB_DIR = os.path.join(os.path.dirname(__file__), "..", "cpcb_hyderabad")

# Map station label → CSV filename prefix
CORE_STATIONS = {
    "Somajiguda":        "Somajiguda_ Hyderabad - TSPCB_2025.csv",
    "Kompally":          "Kompally Municipal Office_ Hyderabad - TSPCB_2025.csv",
    "IITH Kandi":        "IITH Kandi_ Hyderabad - TSPCB_2025.csv",
    "ICRISAT Patancheru":"ICRISAT Patancheru_ Hyderabad - TSPCB_2025.csv",
    "IDA Pashamylaram":  "IDA Pashamylaram_ Hyderabad - TSPCB_2025.csv",
    "Central University":"Central University_ Hyderabad - TSPCB_2025.csv",
    "Zoo Park":          "Zoo Park_ Hyderabad - TSPCB_2025.csv",
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

@lru_cache(maxsize=20)
def load_station_csv(label: str, resample: str = "1D", year: int = 2025):
    all_stations = {**CORE_STATIONS, **EXTRA_STATIONS}
    # Replace 2025 in filename with selected year
    fname_2025 = all_stations.get(label)
    if not fname_2025:
        return None
    fname = fname_2025.replace("_2025.csv", f"_{year}.csv")
    path = os.path.join(CPCB_DIR, fname)
    if not os.path.exists(path):
        return None
    df = pd.read_csv(path, parse_dates=["Timestamp"])
    df = df.rename(columns={"Timestamp": "timestamp", **COL_MAP})
    df = df.set_index("timestamp")
    numeric = df.select_dtypes(include="number")
    df = numeric.resample(resample).mean().reset_index()
    df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%d")
    # round
    for c in df.select_dtypes(include="number").columns:
        df[c] = df[c].round(2)
    return df.dropna(how="all", subset=[c for c in df.columns if c != "timestamp"]).replace({float('nan'): None})


@app.get("/policy/stations")
def get_policy_stations():
    return {
        "core":  list(CORE_STATIONS.keys()),
        "extra": list(EXTRA_STATIONS.keys()),
    }


@app.get("/policy/years")
def get_policy_years(station: str = Query(...)):
    """Return available years for a station."""
    all_stations = {**CORE_STATIONS, **EXTRA_STATIONS}
    fname_2025 = all_stations.get(station)
    if not fname_2025:
        return []
    years = []
    for y in range(2009, 2026):
        fname = fname_2025.replace("_2025.csv", f"_{y}.csv")
        if os.path.exists(os.path.join(CPCB_DIR, fname)):
            years.append(y)
    return sorted(years, reverse=True)


@app.get("/policy/data")
def get_policy_data(
    station: str = Query(...),
    resample: str = Query(default="1D"),
    year: int = Query(default=2025)
):
    df = load_station_csv(station, resample, year)
    if df is None:
        return {"error": f"Station '{station}' not found"}
    return df.to_dict(orient="records")


# ── Forecast / Policy Impact endpoints ───────────────────────────────────────

class ForecastRequest(BaseModel):
    station: str
    pollutant: str = "pm2_5"
    policy_start: str = "2025-03-01"
    policy_end: str   = "2025-04-30"
    forecast_days: int = 90


@app.post("/forecast/policy")
def forecast_policy_impact(req: ForecastRequest):
    from forecaster import run_forecast
    return run_forecast(
        station=req.station,
        pollutant=req.pollutant,
        policy_start=req.policy_start,
        policy_end=req.policy_end,
        forecast_days=req.forecast_days,
    )


@app.get("/forecast/stations")
def get_forecast_stations():
    from forecaster import STATION_FILES, COL_MAP
    return {
        "stations":   list(STATION_FILES.keys()),
        "pollutants": list(COL_MAP.values()),
    }


# ── Multi-year trends endpoint ────────────────────────────────────────────────

STATION_PREFIX_MAP = {
    "Somajiguda":         "Somajiguda_ Hyderabad - TSPCB",
    "Kompally":           "Kompally Municipal Office_ Hyderabad - TSPCB",
    "IITH Kandi":         "IITH Kandi_ Hyderabad - TSPCB",
    "ICRISAT Patancheru": "ICRISAT Patancheru_ Hyderabad - TSPCB",
    "IDA Pashamylaram":   "IDA Pashamylaram_ Hyderabad - TSPCB",
    "Central University": "Central University_ Hyderabad - TSPCB",
    "Zoo Park":           "Zoo Park_ Hyderabad - TSPCB",
}

CPCB_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "cpcb_hyderabad")

TREND_COL_MAP = {
    "PM2.5 (µg/m³)": "pm2_5", "PM10 (µg/m³)": "pm10",
    "NO2 (µg/m³)": "no2",     "SO2 (µg/m³)": "so2",
    "CO (mg/m³)": "co",        "Ozone (µg/m³)": "ozone",
    "NO (µg/m³)": "no",        "NOx (ppb)": "nox",
    "NH3 (µg/m³)": "nh3",      "Benzene (µg/m³)": "benzene",
    "Toluene (µg/m³)": "toluene", "Xylene (µg/m³)": "xylene",
    "AT (°C)": "temp",         "RH (%)": "humidity",
    "WS (m/s)": "wind_speed",
}


@lru_cache(maxsize=10)
def load_multiyear(station: str, resample: str = "ME") -> pd.DataFrame:
    prefix = STATION_PREFIX_MAP.get(station)
    if not prefix:
        return pd.DataFrame()

    dfs = []
    for year in range(2017, 2026):
        path = os.path.join(CPCB_DATA_DIR, f"{prefix}_{year}.csv")
        if not os.path.exists(path):
            continue
        try:
            df = pd.read_csv(path, parse_dates=["Timestamp"])
            df = df.rename(columns={"Timestamp": "timestamp", **TREND_COL_MAP})
            dfs.append(df)
        except Exception:
            continue

    if not dfs:
        return pd.DataFrame()

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.set_index("timestamp")
    available = [c for c in TREND_COL_MAP.values() if c in combined.columns]
    resampled = combined[available].resample(resample).mean()
    resampled = resampled.reset_index()
    resampled["timestamp"] = resampled["timestamp"].dt.strftime("%Y-%m-%d")
    for c in resampled.select_dtypes(include="number").columns:
        resampled[c] = resampled[c].round(2)
    return resampled.dropna(how="all", subset=available).replace({float('nan'): None})


@app.get("/trends/data")
def get_trends(
    station: str  = Query(...),
    resample: str = Query(default="1ME")   # 1ME=monthly, 1W=weekly, 1YE=yearly
):
    df = load_multiyear(station, resample)
    if df.empty:
        return {"error": f"No multi-year data for '{station}'"}
    return df.to_dict(orient="records")


@app.get("/trends/yearly-avg")
def get_yearly_avg(station: str = Query(...)):
    """Annual averages per pollutant — good for long-term trend bars."""
    df = load_multiyear(station, "1YE")
    if df.empty:
        return {"error": f"No data for '{station}'"}
    df["year"] = pd.to_datetime(df["timestamp"]).dt.year
    return df.to_dict(orient="records")
