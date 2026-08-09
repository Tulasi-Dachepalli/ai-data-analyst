import pandas as pd
import numpy as np
from typing import Dict, Any
from utils.statistics import get_numeric_stats, get_categorical_stats, get_correlation_matrix

def compute_dataset_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    rows, cols = df.shape
    
    # Classify columns
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []
    
    for col in df.columns:
        series = df[col]
        col_lower = str(col).lower()
        is_date_name = any(d in col_lower for d in ["date", "year", "month", "time"])
        
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            if is_date_name:
                datetime_cols.append(col)
            else:
                numeric_cols.append(col)
        elif is_date_name:
            datetime_cols.append(col)
        else:
            categorical_cols.append(col)
            
    # Calculate stats for numeric columns
    numeric_stats = {}
    for col in numeric_cols:
        numeric_stats[col] = get_numeric_stats(df[col])
        
    # Calculate stats for categorical columns
    categorical_stats = {}
    for col in categorical_cols:
        categorical_stats[col] = get_categorical_stats(df[col])
        
    # Calculate correlation matrix
    corr_cols, corr_matrix, corr_relations = get_correlation_matrix(df)
    
    return {
        "row_count": rows,
        "column_count": cols,
        "numeric_count": len(numeric_cols),
        "categorical_count": len(categorical_cols),
        "datetime_count": len(datetime_cols),
        "numeric_stats": numeric_stats,
        "categorical_stats": categorical_stats,
        "correlation": {
            "columns": corr_cols,
            "matrix": corr_matrix,
            "relationships": corr_relations
        }
    }
