"""
AQI Predictor using TabPFN
---------------------------
Uses 9 years of real CPCB 15-min data (2017-2025) for training.
Features: time + all available correlated pollutants/met values.
"""

import os
import pandas as pd
import numpy as np
from functools import lru_cache
from hf_loader import load_csv_from_hf

STATION_PREFIX = {
    "hyd-somajiguda-tspcb-2024-25":               "Somajiguda_ Hyderabad - TSPCB",
    "hyd-kompally-municipal-office-tspcb-2024-25": "Kompally Municipal Office_ Hyderabad - TSPCB",
    "hyd-iith-kandi-tspcb-2024-25":               "IITH Kandi_ Hyderabad - TSPCB",
    "hyd-icrisat-patancheru-tspcb-2024-25":        "ICRISAT Patancheru_ Hyderabad - TSPCB",
    "hyd-ida-pashamylaram-tspcb-2024-25":          "IDA Pashamylaram_ Hyderabad - TSPCB",
    "hyd-central-university-tspcb-2024-25":        "Central University_ Hyderabad - TSPCB",
    "hyd-zoo-park-tspcb-2024-25":                  "Zoo Park_ Hyderabad - TSPCB",
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
    "SR (W/mt2)": "solar_rad",
}

ALL_FEATURES = list(COL_MAP.values())
TIME_FEATURES = ["hour_sin", "hour_cos", "dow_sin", "dow_cos", "month", "day_of_year"]


def extract_time_features(df: pd.DataFrame, ts_col: str = "timestamp") -> pd.DataFrame:
    df = df.copy()
    ts = pd.to_datetime(df[ts_col])
    df["hour"]        = ts.dt.hour
    df["day_of_week"] = ts.dt.dayofweek
    df["day_of_year"] = ts.dt.dayofyear
    df["month"]       = ts.dt.month
    df["hour_sin"]    = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"]    = np.cos(2 * np.pi * df["hour"] / 24)
    df["dow_sin"]     = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"]     = np.cos(2 * np.pi * df["day_of_week"] / 7)
    return df


@lru_cache(maxsize=7)
def load_station_data(zone_id: str) -> pd.DataFrame:
    """Load all years of CPCB data for a station, resampled to 1-hour averages."""
    prefix = STATION_PREFIX.get(zone_id)
    if not prefix:
        return pd.DataFrame()

    dfs = []
    for year in range(2017, 2026):
        filename = f"{prefix}_{year}.csv"
        try:
            df = load_csv_from_hf(filename)
            if df.empty:
                continue
            df = df.rename(columns={"Timestamp": "timestamp", **COL_MAP})
            dfs.append(df[["timestamp"] + [c for c in COL_MAP.values() if c in df.columns]])
        except Exception as e:
            print(f"  Skipping {filename}: {e}")

    if not dfs:
        return pd.DataFrame()

    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.set_index("timestamp")
    # Resample to 1-hour to reduce size while keeping patterns
    combined = combined.resample("1h").mean()
    combined = combined.reset_index()
    combined = extract_time_features(combined)
    print(f"Loaded {len(combined):,} hourly rows for {zone_id}")
    return combined


# ── Smart sample: stratified by month to preserve seasonal patterns ──────────
def smart_sample(df: pd.DataFrame, n: int = 900) -> pd.DataFrame:
    """Sample evenly across months to preserve seasonal patterns."""
    if len(df) <= n:
        return df
    per_month = max(1, n // 12)
    sampled = []
    for month in range(1, 13):
        month_df = df[df["month"] == month]
        if len(month_df) > 0:
            sampled.append(month_df.sample(min(per_month, len(month_df)), random_state=42))
    result = pd.concat(sampled, ignore_index=True)
    # Top up if needed
    if len(result) < n:
        remaining = df[~df.index.isin(result.index)]
        extra = remaining.sample(min(n - len(result), len(remaining)), random_state=42)
        result = pd.concat([result, extra], ignore_index=True)
    return result


_model_cache: dict = {}


def warmup():
    """Pre-fit TabPFN models for all zones × key targets at startup."""
    from tabpfn import TabPFNRegressor

    KEY_TARGETS = ["pm2_5", "pm10", "no2", "so2", "co", "ozone", "temp", "humidity"]

    print(f"Warming up TabPFN using CPCB 9-year data...")
    for zone_id in STATION_PREFIX.keys():
        df = load_station_data(zone_id)
        if df.empty:
            continue

        for target in KEY_TARGETS:
            if target not in df.columns:
                continue

            # Use time features + correlated pollutants as features
            corr_cols = [c for c in ALL_FEATURES if c in df.columns and c != target]
            feature_cols = TIME_FEATURES + corr_cols

            train_df = df.dropna(subset=TIME_FEATURES + [target])
            # Fill NaN in corr_cols with column mean
            for c in corr_cols:
                if c in train_df.columns:
                    train_df[c] = train_df[c].fillna(train_df[c].mean())

            train_df = smart_sample(train_df, 900)
            if len(train_df) < 10:
                continue

            try:
                model = TabPFNRegressor(device="cpu", n_estimators=16, ignore_pretraining_limits=True)
                model.fit(train_df[feature_cols].values, train_df[target].values)
                _model_cache[(zone_id, target)] = (model, feature_cols)
                print(f"  ✓ {zone_id.split('-')[1]} / {target} ({len(train_df)} rows)")
            except Exception as e:
                print(f"  ✗ {zone_id}/{target}: {e}")

    print(f"Warmup complete. {len(_model_cache)} models cached.")


def predict(timestamp: str, zone_id: str, known: dict, target: str) -> dict:
    from tabpfn import TabPFNRegressor

    df = load_station_data(zone_id)
    if df.empty:
        return {"error": f"No CPCB data for zone '{zone_id}'"}
    if target not in df.columns:
        return {"error": f"Target '{target}' not in data"}

    # Build feature set: time + all available correlated cols + user-provided known values
    corr_cols  = [c for c in ALL_FEATURES if c in df.columns and c != target]
    feature_cols = TIME_FEATURES + corr_cols
    cache_key  = (zone_id, target)

    # If user provided known values, re-fit with those as additional features
    extra_known = {k: v for k, v in known.items() if k in df.columns and k != target}

    if cache_key in _model_cache and not extra_known:
        model, feature_cols = _model_cache[cache_key]
        train_df = df.dropna(subset=TIME_FEATURES + [target])
    else:
        train_df = df.dropna(subset=TIME_FEATURES + [target])
        for c in corr_cols:
            if c in train_df.columns:
                train_df[c] = train_df[c].fillna(train_df[c].mean())
        train_df = smart_sample(train_df, 900)
        if len(train_df) < 10:
            return {"error": "Not enough training data"}
        model = TabPFNRegressor(device="cpu", n_estimators=16, ignore_pretraining_limits=True)
        model.fit(train_df[feature_cols].values, train_df[target].values)

    # Build query row
    query_ts  = pd.DataFrame([{"timestamp": timestamp}])
    query_ts  = extract_time_features(query_ts)
    query_row = {f: float(query_ts[f].values[0]) for f in TIME_FEATURES}

    # Fill corr_cols with known values or column means
    col_means = df[corr_cols].mean().to_dict()
    for c in corr_cols:
        query_row[c] = float(extra_known.get(c, known.get(c, col_means.get(c, 0))))

    X_query    = np.array([[query_row[f] for f in feature_cols]])
    prediction = model.predict(X_query)[0]

    return {
        "target":          target,
        "predicted_value": round(float(prediction), 3),
        "zone_id":         zone_id,
        "timestamp":       timestamp,
        "features_used":   feature_cols,
        "training_rows":   len(train_df),
        "used_cache":      cache_key in _model_cache and not extra_known,
        "data_source":     "CPCB 2017-2025 (9 years, hourly)",
    }
