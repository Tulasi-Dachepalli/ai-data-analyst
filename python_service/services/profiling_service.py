import pandas as pd
import numpy as np
from typing import Dict, Any
from utils.statistics import get_numeric_stats

def compute_profile(df: pd.DataFrame) -> Dict[str, Any]:
    rows, cols = df.shape
    total_cells = rows * cols
    
    if total_cells == 0:
        return {
            "rows": rows,
            "columns": cols,
            "duplicate_rows": 0,
            "missing_cells": 0,
            "missing_percentage": 0.0,
            "quality_score": 100.0,
            "columns_info": []
        }
        
    duplicate_rows = int(df.duplicated().sum())
    missing_cells = int(df.isna().sum().sum())
    missing_percentage = float(round((missing_cells / total_cells) * 100, 2))
    
    columns_info = []
    total_outliers = 0
    
    for col in df.columns:
        series = df[col]
        dtype_str = str(series.dtype)
        nulls = int(series.isna().sum())
        unique_count = int(series.nunique())
        
        # Default numeric stats
        mean = None
        median = None
        min_val = None
        max_val = None
        outlier_count = 0
        
        # Compute stats only for actual numeric columns
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            valid_nums = series.dropna()
            if not valid_nums.empty:
                stats = get_numeric_stats(series)
                mean = stats["mean"]
                median = stats["median"]
                min_val = stats["min"]
                max_val = stats["max"]
                outlier_count = stats["outlier_count"]
                total_outliers += outlier_count
                 
        columns_info.append({
            "name": str(col),
            "dtype": dtype_str,
            "nulls": nulls,
            "unique_count": unique_count,
            "mean": mean,
            "median": median,
            "min": min_val,
            "max": max_val,
            "outlier_count": outlier_count
        })
        
    # Calculate Data Quality Score
    # Weighting: Missing cells (50%), Duplicates (30%), Outliers (20%)
    missing_penalty = (missing_cells / total_cells) * 100
    duplicate_penalty = (duplicate_rows / rows) * 100 if rows > 0 else 0
    outlier_penalty = (total_outliers / total_cells) * 100 if total_cells > 0 else 0
    
    quality_score = 100.0 - (0.5 * missing_penalty + 0.3 * duplicate_penalty + 0.2 * outlier_penalty)
    quality_score = float(round(max(0.0, min(100.0, quality_score)), 2))
    
    return {
        "rows": rows,
        "columns": cols,
        "duplicate_rows": duplicate_rows,
        "missing_cells": missing_cells,
        "missing_percentage": missing_percentage,
        "quality_score": quality_score,
        "columns_info": columns_info,
        "rows_data": df.where(pd.notnull(df), None).to_dict(orient="records"),
        "columns_list": df.columns.tolist()
    }
