import pandas as pd
import numpy as np
from typing import Dict, Any, List

def detect_ml_tasks(df: pd.DataFrame) -> Dict[str, Any]:
    rows, cols = df.shape
    classification_candidates = []
    regression_candidates = []
    
    # Standardize column headers
    df.columns = [str(c).strip() for c in df.columns]
    
    for col in df.columns:
        series = df[col]
        non_null_count = int(series.dropna().size)
        if non_null_count == 0:
            continue
            
        missing_pct = float(series.isna().sum() / rows * 100) if rows > 0 else 100.0
        # Skip columns with > 50% missing values
        if missing_pct > 50.0:
            continue
            
        unique_count = int(series.nunique())
        # Skip constant columns
        if unique_count <= 1:
            continue
            
        unique_ratio = unique_count / non_null_count
        col_lower = str(col).lower()
        
        # Check for ID columns (e.g. index identifiers, primary keys)
        is_id_name = any(k in col_lower for k in ["id", "uuid", "key", "index", "code", "no"])
        if is_id_name and unique_ratio > 0.8 and unique_count > 15:
            continue
            
        # Detect dtype classification
        is_numeric = pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)
        is_bool = pd.api.types.is_bool_dtype(series) or (unique_count == 2)
        is_integer = pd.api.types.is_integer_dtype(series)
        
        # 1. Classification Target check
        if is_bool:
            classification_candidates.append({
                "column": str(col),
                "confidence": 0.98
            })
        elif not is_numeric: # Categorical / Object string columns
            if unique_count <= 15:
                confidence = round(0.95 - (unique_ratio * 0.1), 2)
                classification_candidates.append({
                    "column": str(col),
                    "confidence": confidence
                })
            elif unique_count <= 30 and unique_ratio < 0.05:
                classification_candidates.append({
                    "column": str(col),
                    "confidence": 0.75
                })
        elif is_integer and unique_count <= 10: # Low unique count integers
            classification_candidates.append({
                "column": str(col),
                "confidence": 0.80
            })
            
        # 2. Regression Target check
        if is_numeric and unique_count > 5:
            if not is_id_name:
                confidence = 0.95 if unique_count > 20 else 0.85
                regression_candidates.append({
                    "column": str(col),
                    "confidence": confidence
                })
                
    # 3. Clustering availability
    # Needs at least 2 distinct numeric columns with valid variation
    numeric_columns = [
        col for col in df.columns 
        if pd.api.types.is_numeric_dtype(df[col]) 
        and not pd.api.types.is_bool_dtype(df[col]) 
        and df[col].nunique() > 1
        and not any(k in str(col).lower() for k in ["id", "key", "code"])
    ]
    
    clustering_available = len(numeric_columns) >= 2
    
    return {
        "classification_candidates": classification_candidates,
        "regression_candidates": regression_candidates,
        "clustering": {
            "available": clustering_available,
            "numeric_features": numeric_columns if clustering_available else [],
            "reason": "Multiple suitable numeric features detected" if clustering_available else "At least 2 numeric columns required for K-Means"
        }
    }
