import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

def get_iqr_bounds(series: pd.Series) -> Tuple[float, float, float, float, float]:
    valid = series.dropna()
    if valid.empty:
        return 0.0, 0.0, 0.0, 0.0, 0.0
    q1 = float(valid.quantile(0.25))
    q3 = float(valid.quantile(0.75))
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return lower, upper, q1, q3, iqr

def get_numeric_stats(series: pd.Series) -> Dict[str, Any]:
    valid = series.dropna()
    count = int(series.size)
    missing = int(series.isna().sum())
    unique = int(series.nunique())
    
    if valid.empty:
        return {
            "count": count, "missing": missing, "unique": unique,
            "mean": None, "median": None, "mode": None, "min": None, "max": None,
            "range": None, "variance": None, "std": None, "q1": None, "q2": None, "q3": None,
            "iqr": None, "skewness": None, "kurtosis": None, "outlier_count": 0
        }
        
    mean = float(valid.mean())
    median = float(valid.median())
    
    # Calculate mode safely
    mode_series = valid.mode()
    mode_val = float(mode_series.iloc[0]) if not mode_series.empty else None
    
    min_val = float(valid.min())
    max_val = float(valid.max())
    range_val = max_val - min_val
    variance = float(valid.var()) if len(valid) > 1 else 0.0
    std = float(valid.std()) if len(valid) > 1 else 0.0
    
    lower, upper, q1, q3, iqr = get_iqr_bounds(valid)
    outliers = valid[(valid < lower) | (valid > upper)]
    outlier_count = int(outliers.count())
    
    # Skewness and Kurtosis
    skew = float(valid.skew()) if len(valid) > 2 else 0.0
    kurt = float(valid.kurt()) if len(valid) > 3 else 0.0
    
    # Check for NaN bounds of floating limits
    return {
        "count": count,
        "missing": missing,
        "unique": unique,
        "mean": round(mean, 2) if not pd.isna(mean) else None,
        "median": round(median, 2) if not pd.isna(median) else None,
        "mode": round(mode_val, 2) if mode_val is not None and not pd.isna(mode_val) else None,
        "min": round(min_val, 2) if not pd.isna(min_val) else None,
        "max": round(max_val, 2) if not pd.isna(max_val) else None,
        "range": round(range_val, 2) if not pd.isna(range_val) else None,
        "variance": round(variance, 2) if not pd.isna(variance) else None,
        "std": round(std, 2) if not pd.isna(std) else None,
        "q1": round(q1, 2) if not pd.isna(q1) else None,
        "q2": round(median, 2) if not pd.isna(median) else None,
        "q3": round(q3, 2) if not pd.isna(q3) else None,
        "iqr": round(iqr, 2) if not pd.isna(iqr) else None,
        "skewness": round(skew, 2) if not pd.isna(skew) else None,
        "kurtosis": round(kurt, 2) if not pd.isna(kurt) else None,
        "outlier_count": outlier_count
    }

def get_categorical_stats(series: pd.Series) -> Dict[str, Any]:
    count = int(series.size)
    missing = int(series.isna().sum())
    unique = int(series.nunique())
    
    if unique == 0:
        return {
            "unique": unique,
            "missing": missing,
            "most_frequent": None,
            "frequencies": []
        }
        
    mode_series = series.dropna().mode()
    most_frequent = str(mode_series.iloc[0]) if not mode_series.empty else None
    
    # Calculate top categories frequencies distribution
    value_counts = series.dropna().value_counts()
    frequencies = []
    total_valid = int(value_counts.sum())
    
    # Limit categories breakdown listing to top 10 rows
    for val, cnt in value_counts.head(10).items():
        pct = float(round((cnt / total_valid) * 100, 2)) if total_valid > 0 else 0.0
        frequencies.append({
            "value": str(val),
            "count": int(cnt),
            "percentage": pct
        })
        
    return {
        "unique": unique,
        "missing": missing,
        "most_frequent": most_frequent,
        "frequencies": frequencies
    }

def get_correlation_matrix(df: pd.DataFrame) -> Tuple[List[str], List[List[float]], List[Dict[str, Any]]]:
    # Select numeric columns
    numeric_df = df.select_dtypes(include=[np.number]).dropna(how="all")
    if numeric_df.empty:
        return [], [], []
        
    cols = numeric_df.columns.tolist()
    # Filter columns having zero variance (constant columns) to avoid Pearson divide by zero
    valid_cols = [c for c in cols if numeric_df[c].dropna().nunique() > 1]
    
    if not valid_cols:
        return [], [], []
        
    corr_df = numeric_df[valid_cols].corr(method="pearson")
    matrix = []
    relationships = []
    
    for i, col1 in enumerate(valid_cols):
        row_values = []
        for j, col2 in enumerate(valid_cols):
            val = corr_df.loc[col1, col2]
            # Replace NaNs or infinite values with 0.0/1.0
            if pd.isna(val):
                val = 1.0 if col1 == col2 else 0.0
            row_values.append(float(round(val, 3)))
            
            # Record relationships only once (lower triangle)
            if i > j:
                abs_val = abs(val)
                strength = "none"
                if abs_val >= 0.7:
                    strength = "strong"
                elif abs_val >= 0.4:
                    strength = "moderate"
                elif abs_val >= 0.1:
                    strength = "weak"
                    
                direction = "positive" if val > 0 else "negative"
                relationships.append({
                    "column": col1,
                    "with": col2,
                    "value": float(round(val, 3)),
                    "strength": strength,
                    "direction": direction
                })
        matrix.append(row_values)
        
    return valid_cols, matrix, relationships
