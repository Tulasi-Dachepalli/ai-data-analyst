import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from statsmodels.tsa.seasonal import seasonal_decompose

def detect_date_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Scans the dataframe to identify potential date/time columns.
    Returns list of candidate dictionaries with column names and confidence scores.
    """
    candidates = []
    date_keywords = ["date", "time", "year", "month", "day", "timestamp", "dt", "period"]
    
    for col in df.columns:
        series = df[col]
        col_lower = str(col).lower()
        
        # Check name keyword
        keyword_match = any(kw in col_lower for kw in date_keywords)
        
        # Check if dtype is already datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            candidates.append({"column": col, "confidence": 1.0})
            continue
            
        # Try casting to datetime
        # We sample up to 100 rows to speed up check
        sample_series = series.dropna().head(100)
        if sample_series.empty:
            continue
            
        try:
            converted = pd.to_datetime(sample_series, errors="coerce")
            valid_ratio = converted.notna().sum() / len(sample_series)
            
            if valid_ratio > 0.8:
                confidence = 0.5 + (valid_ratio * 0.4)
                if keyword_match:
                    confidence = min(1.0, confidence + 0.1)
                candidates.append({"column": col, "confidence": round(confidence, 2)})
        except Exception:
            pass
            
    # Sort candidates by confidence descending
    return sorted(candidates, key=lambda x: x["confidence"], reverse=True)

def detect_target_columns(df: pd.DataFrame, date_cols: List[str]) -> List[Dict[str, Any]]:
    """
    Scans columns to identify potential numeric target variables suitable for forecasting.
    """
    candidates = []
    id_keywords = ["id", "code", "index", "phone", "zip", "postal", "latitude", "longitude"]
    
    for col in df.columns:
        if col in date_cols:
            continue
            
        series = df[col]
        col_lower = str(col).lower()
        
        # Must be numeric and not index-like
        if not pd.api.types.is_numeric_dtype(series) or pd.api.types.is_bool_dtype(series):
            continue
            
        # Check cardinality and unique counts
        unique_count = series.nunique()
        if unique_count <= 2: # binary flag
            continue
            
        # Exclude common ID fields
        if any(kw in col_lower for kw in id_keywords):
            continue
            
        # Calculate confidence
        confidence = 0.8
        # Prefer floats over integers for continuous variables like Sales
        if pd.api.types.is_float_dtype(series):
            confidence += 0.1
            
        # Penalize if missing values ratio is high
        null_ratio = series.isnull().mean()
        confidence -= (null_ratio * 0.5)
        
        candidates.append({
            "column": col,
            "confidence": max(0.1, round(confidence, 2))
        })
        
    return sorted(candidates, key=lambda x: x["confidence"], reverse=True)

def detect_frequency(dates: pd.Series) -> Dict[str, Any]:
    """
    Robustly identifies date interval frequency and confidence intervals.
    """
    try:
        # Convert, sort and drop duplicates/nulls
        parsed_dates = pd.to_datetime(dates, errors="coerce").dropna().sort_values().unique()
        if len(parsed_dates) < 3:
            return {
                "frequency": "irregular",
                "confidence": 0.0,
                "median_interval_days": 0.0,
                "irregularity": 1.0,
                "warning": "Insufficient unique dates to establish a frequency."
            }
            
        # Calculate daily delta differences
        deltas = pd.Series(parsed_dates).diff().dt.days.dropna()
        median_delta = float(deltas.median())
        
        if median_delta <= 0:
            return {
                "frequency": "irregular",
                "confidence": 0.0,
                "median_interval_days": 0.0,
                "irregularity": 1.0,
                "warning": "Data contains zero or negative time intervals."
            }
            
        # Measure irregularity
        std_delta = float(deltas.std())
        irregularity = std_delta / median_delta if median_delta > 0 else 1.0
        
        # Calculate ratio of intervals falling within 15% range of median
        close_to_median = deltas.between(median_delta * 0.85, median_delta * 1.15).mean()
        confidence = float(close_to_median)
        
        # Classify frequency
        if median_delta >= 0.8 and median_delta <= 1.2:
            frequency = "daily"
        elif median_delta >= 6.0 and median_delta <= 8.0:
            frequency = "weekly"
        elif median_delta >= 26.0 and median_delta <= 32.0:
            frequency = "monthly"
        elif median_delta >= 80.0 and median_delta <= 95.0:
            frequency = "quarterly"
        elif median_delta >= 350.0 and median_delta <= 375.0:
            frequency = "yearly"
        else:
            frequency = "irregular"
            confidence = min(confidence, 0.4) # force low confidence for custom intervals
            
        warning = None
        if confidence < 0.75 or frequency == "irregular":
            warning = "Irregular time intervals detected. Please select frequency manually."
            
        return {
            "frequency": frequency,
            "confidence": round(confidence, 2),
            "median_interval_days": round(median_delta, 1),
            "irregularity": round(irregularity, 3),
            "warning": warning
        }
    except Exception as e:
        return {
            "frequency": "irregular",
            "confidence": 0.0,
            "median_interval_days": 0.0,
            "irregularity": 1.0,
            "warning": f"Frequency detection error: {str(e)}"
        }

def detect_seasonality(series: pd.Series, frequency: str) -> Dict[str, Any]:
    """
    Evaluates if time series exhibits significant seasonal cycles.
    """
    n_samples = len(series)
    
    # Map frequency to standard seasonal period counts
    freq_periods = {
        "daily": 7,       # weekly seasonality
        "weekly": 52,     # yearly seasonality
        "monthly": 12,    # yearly seasonality
        "quarterly": 4    # yearly seasonality
    }
    
    period = freq_periods.get(frequency)
    if not period or n_samples < (2 * period):
        return {
            "seasonality_detected": False,
            "seasonal_period": None,
            "strength": 0.0,
            "reason": f"Insufficient data points ({n_samples}) to detect a seasonal cycle for frequency '{frequency}' (requires at least {2 * period} points)."
        }
        
    try:
        # Impute temporary missing values to run seasonal decomposition
        clean_series = series.interpolate(method="linear").fillna(method="bfill").fillna(method="ffill")
        
        # Run additive seasonal decomposition
        decomp = seasonal_decompose(clean_series, model="additive", period=period)
        
        # Calculate seasonality strength: Var(Residual) / Var(Seasonal + Residual)
        var_resid = np.var(decomp.resid.dropna())
        var_seas_resid = np.var((decomp.seasonal + decomp.resid).dropna())
        
        if var_seas_resid > 0:
            strength = float(max(0.0, 1.0 - (var_resid / var_seas_resid)))
        else:
            strength = 0.0
            
        detected = strength > 0.40
        
        return {
            "seasonality_detected": detected,
            "seasonal_period": period if detected else None,
            "strength": round(strength, 2),
            "reason": f"Detected seasonal strength of {round(strength, 2)} with period length {period}."
        }
    except Exception as e:
        return {
            "seasonality_detected": False,
            "seasonal_period": None,
            "strength": 0.0,
            "reason": f"Seasonal decomposition failed: {str(e)}"
        }

def analyze_forecasting_suitability(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Aggregates all time-series checks and return structural forecastability index.
    """
    n_rows = len(df)
    if n_rows < 5:
        return {
            "forecastable": False,
            "confidence": 0.0,
            "reason": f"Dataset has only {n_rows} rows. Forecasting requires at least 5 observations."
        }
        
    date_candidates = detect_date_columns(df)
    if not date_candidates:
        return {
            "forecastable": False,
            "confidence": 0.0,
            "reason": "No valid Date or Timestamp columns detected."
        }
        
    best_date_col = date_candidates[0]["column"]
    
    # Run target checks
    target_candidates = detect_target_columns(df, [best_date_col])
    if not target_candidates:
        return {
            "forecastable": False,
            "confidence": 0.0,
            "reason": "No suitable continuous numeric target variables detected."
        }
        
    best_target_col = target_candidates[0]["column"]
    
    # Run frequency checks
    freq_data = detect_frequency(df[best_date_col])
    
    # Run seasonality checks (if frequency detected)
    season_data = {"seasonality_detected": False, "seasonal_period": None, "strength": 0.0}
    if freq_data["frequency"] != "irregular":
        try:
            # Temporarily aggregate/sort to run check
            temp_df = df[[best_date_col, best_target_col]].copy()
            temp_df[best_date_col] = pd.to_datetime(temp_df[best_date_col], errors="coerce")
            temp_df = temp_df.dropna().sort_values(best_date_col)
            # Group duplicate dates
            grouped = temp_df.groupby(best_date_col)[best_target_col].mean()
            season_data = detect_seasonality(grouped, freq_data["frequency"])
        except Exception:
            pass
            
    # Compute overall forecastability confidence
    forecastable = freq_data["frequency"] != "irregular" and n_rows >= 5
    overall_confidence = min(date_candidates[0]["confidence"], target_candidates[0]["confidence"])
    if freq_data["confidence"] < 0.7:
        overall_confidence *= 0.8
        
    return {
        "forecastable": forecastable,
        "confidence": round(overall_confidence, 2),
        "date_column": best_date_col,
        "target_column": best_target_col,
        "frequency": freq_data["frequency"],
        "observations": n_rows,
        "frequency_details": freq_data,
        "seasonality_details": season_data
    }
