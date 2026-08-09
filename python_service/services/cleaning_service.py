import pandas as pd
import numpy as np
from typing import Dict, Any

def clean_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    original_rows, original_cols = df.shape
    
    # Standardize column headers by stripping whitespace
    df.columns = [str(c).strip() for c in df.columns]
    
    # 1. Normalize duplicate whitespace in string columns
    whitespace_normalized = 0
    for col in df.select_dtypes(include=['object']):
        original_series = df[col].astype(str)
        # Strip outer whitespace and compress multiple spaces inside words
        cleaned_series = df[col].apply(
            lambda x: " ".join(str(x).split()) if pd.notnull(x) else x
        )
        
        diff_mask = (original_series != cleaned_series.astype(str)) & df[col].notnull()
        whitespace_normalized += int(diff_mask.sum())
        df[col] = cleaned_series

    # 2. Remove completely empty columns (all values are null)
    empty_columns = [col for col in df.columns if df[col].isnull().all()]
    empty_columns_removed = len(empty_columns)
    df = df.drop(columns=empty_columns)

    # 3. Remove constant columns (where only a single unique value exists, disregarding nulls)
    constant_columns = [col for col in df.columns if df[col].nunique(dropna=True) <= 1]
    constant_columns_removed = len(constant_columns)
    df = df.drop(columns=constant_columns)

    # 4. Impute null values for remaining columns
    missing_values_filled = 0
    for col in df.columns:
        null_mask = df[col].isnull()
        null_count = int(null_mask.sum())
        if null_count > 0:
            missing_values_filled += null_count
            if pd.api.types.is_numeric_dtype(df[col]) and not pd.api.types.is_bool_dtype(df[col]):
                median_val = df[col].median()
                if pd.isnull(median_val):
                    median_val = 0
                df[col] = df[col].fillna(median_val)
            else:
                if not df[col].mode().empty:
                    mode_val = df[col].mode()[0]
                else:
                    mode_val = "Unknown"
                df[col] = df[col].fillna(mode_val)

    # 5. Drop duplicate rows
    duplicates_removed = int(df.duplicated().sum())
    df = df.drop_duplicates()

    cleaned_rows, cleaned_cols = df.shape
    
    # Format NaNs to None for JSON serialization
    cleaned_data = df.where(pd.notnull(df), None).to_dict(orient="records")
    columns_list = df.columns.tolist()
    
    return {
        "original_rows": original_rows,
        "cleaned_rows": cleaned_rows,
        "original_columns": original_cols,
        "cleaned_columns": cleaned_cols,
        "duplicates_removed": duplicates_removed,
        "missing_values_filled": missing_values_filled,
        "whitespace_normalized": whitespace_normalized,
        "empty_columns_removed": empty_columns_removed,
        "constant_columns_removed": constant_columns_removed,
        "cleaned_data": cleaned_data,
        "columns_list": columns_list
    }
