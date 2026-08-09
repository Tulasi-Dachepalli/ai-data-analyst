import numpy as np
import pandas as pd
from typing import List, Dict, Any

def detect_anomalies(df: pd.DataFrame, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    anomalies = []
    if df.empty:
        return anomalies

    # 1. Row Outliers (IQR and Z-score)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # We look at profiling info to identify columns with high outlier counts
    cols_to_check = []
    columns_info = profile.get("columns_info", [])
    for col_info in columns_info:
        col_name = col_info.get("name")
        if col_name in numeric_cols and col_info.get("outlier_count", 0) > 0:
            cols_to_check.append(col_name)

    for col in cols_to_check:
        series = df[col].dropna()
        if len(series) < 5:
            continue
        
        # IQR
        q1 = np.percentile(series, 25)
        q3 = np.percentile(series, 75)
        iqr = q3 - q1
        lower_iqr = q1 - 1.5 * iqr
        upper_iqr = q3 + 1.5 * iqr
        
        # Z-score
        mean_val = series.mean()
        std_val = series.std()
        
        iqr_outliers = series[(series < lower_iqr) | (series > upper_iqr)]
        z_outliers = pd.Series(dtype=float)
        if std_val > 0:
            z_outliers = series[np.abs(series - mean_val) / std_val > 3.0]
            
        combined_indices = set(iqr_outliers.index).union(set(z_outliers.index))
        
        # Add up to 10 most extreme outliers per column to avoid payload bloat
        added_count = 0
        for idx in combined_indices:
            if added_count >= 10:
                break
            val = float(series.loc[idx])
            method = "IQR"
            if idx in z_outliers.index:
                method = "Z-Score"
                if idx in iqr_outliers.index:
                    method = "IQR & Z-Score"
                    
            severity = "medium"
            if std_val > 0 and np.abs(val - mean_val) / std_val > 4.5:
                severity = "high"
            elif iqr > 0 and (val < q1 - 3 * iqr or val > q3 + 3 * iqr):
                severity = "high"
                
            anomalies.append({
                "type": "outlier",
                "column": col,
                "row_index": int(idx),
                "value": val,
                "method": method,
                "severity": severity
            })
            added_count += 1

    # 2. Chronological Spikes and Drops
    # Check if there is a date column in the profile
    date_col = None
    for col_info in columns_info:
        dtype = col_info.get("dtype", "").lower()
        name_lower = col_info.get("name", "").lower()
        if "date" in dtype or "time" in dtype or "date" in name_lower or "timestamp" in name_lower:
            date_col = col_info.get("name")
            break
            
    if date_col and len(df) >= 3:
        try:
            # Copy to avoid side-effects
            ts_df = df.copy()
            ts_df["__parsed_date"] = pd.to_datetime(ts_df[date_col], errors="coerce")
            ts_df = ts_df.dropna(subset=["__parsed_date"]).sort_values("__parsed_date").reset_index()
            
            for col in numeric_cols:
                if col == date_col:
                    continue
                
                vals = ts_df[col].astype(float).values
                dates = ts_df[date_col].astype(str).values
                orig_indices = ts_df["index"].values
                
                diffs = np.diff(vals)
                if len(diffs) < 3:
                    continue
                    
                median_diffs = np.median(diffs)
                mad_diffs = np.median(np.abs(diffs - median_diffs))
                std_diffs = np.std(diffs)
                
                # Robust threshold: 3 * MAD (or 3 * std if MAD is 0 due to constant steps)
                threshold = 3 * mad_diffs if mad_diffs > 0 else 3 * std_diffs
                if threshold == 0:
                    threshold = 1e-5
                
                for i in range(1, len(vals)):
                    prev_val = float(vals[i - 1])
                    curr_val = float(vals[i])
                    
                    if prev_val == 0:
                        continue
                        
                    change_percent = ((curr_val - prev_val) / abs(prev_val)) * 100
                    abs_diff = curr_val - prev_val
                    
                    # Spike/Drop: change exceeds 200% and delta exceeds robust threshold
                    if abs(change_percent) >= 200.0 and abs(abs_diff - median_diffs) > threshold:
                        anomaly_type = "spike" if curr_val > prev_val else "drop"
                        severity = "high" if abs(change_percent) >= 500.0 else "medium"
                        
                        anomalies.append({
                            "type": anomaly_type,
                            "column": col,
                            "date": str(dates[i]),
                            "row_index": int(orig_indices[i]),
                            "previous_value": prev_val,
                            "current_value": curr_val,
                            "change_percent": round(float(change_percent), 2),
                            "method": "Chronological Step Delta",
                            "severity": severity
                        })
        except Exception as e:
            # Soft fallback if date parsing fails
            print(f"Time-series anomaly detector error: {e}")

    # Return sorted by severity (high first)
    anomalies.sort(key=lambda x: 0 if x["severity"] == "high" else (1 if x["severity"] == "medium" else 2))
    return anomalies
