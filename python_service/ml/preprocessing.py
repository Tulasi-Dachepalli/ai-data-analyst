import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from typing import List, Tuple

class DatetimeExtractor(BaseEstimator, TransformerMixin):
    def __init__(self, date_cols: List[str] = None):
        self.date_cols = date_cols

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_out = pd.DataFrame(index=X.index)
        for col in self.date_cols:
            if col not in X.columns:
                continue
            series = pd.to_datetime(X[col], errors='coerce')
            
            if series.isnull().all():
                X_out[f"{col}_year"] = 2026
                X_out[f"{col}_month"] = 1
                X_out[f"{col}_day"] = 1
                X_out[f"{col}_dayofweek"] = 0
                X_out[f"{col}_dayofyear"] = 1
            else:
                # Safe date imputations using mode
                mode_date = series.mode()
                fill_val = mode_date.iloc[0] if not mode_date.empty else pd.Timestamp("2026-01-01")
                series = series.fillna(fill_val)
                X_out[f"{col}_year"] = series.dt.year.astype(float)
                X_out[f"{col}_month"] = series.dt.month.astype(float)
                X_out[f"{col}_day"] = series.dt.day.astype(float)
                X_out[f"{col}_dayofweek"] = series.dt.dayofweek.astype(float)
                X_out[f"{col}_dayofyear"] = series.dt.dayofyear.astype(float)
        return X_out

def build_preprocessing_pipeline(
    df: pd.DataFrame, 
    features: List[str]
) -> Tuple[ColumnTransformer, List[str], List[str], List[str]]:
    # Classify feature columns
    numeric_cols = []
    categorical_cols = []
    datetime_cols = []
    
    for col in features:
        if col not in df.columns:
            continue
        series = df[col]
        # Remove constant columns (where only 1 unique value exists)
        if series.nunique(dropna=True) <= 1:
            continue
            
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
            
    # Assemble ColumnTransformer pipeline
    transformers = []
    
    if numeric_cols:
        numeric_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        transformers.append(('num', numeric_pipeline, numeric_cols))
        
    if categorical_cols:
        categorical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            # Use sparse_output=False for safe numpy matrix extraction
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        transformers.append(('cat', categorical_pipeline, categorical_cols))
        
    if datetime_cols:
        datetime_pipeline = Pipeline([
            ('extractor', DatetimeExtractor(date_cols=datetime_cols))
        ])
        transformers.append(('date', datetime_pipeline, datetime_cols))
        
    preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')
    return preprocessor, numeric_cols, categorical_cols, datetime_cols
