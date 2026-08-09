import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional

# Map detected frequency to standard pandas resampling offsets
FREQ_MAP = {
    "daily": "D",
    "weekly": "W",
    "monthly": "MS",
    "quarterly": "QS",
    "yearly": "YS"
}

def prepare_time_series(
    df: pd.DataFrame, 
    date_col: str, 
    target_col: str, 
    frequency: str
) -> Tuple[pd.Series, Dict[str, Any]]:
    """
    Parses dates, groups duplicates, resamples onto a complete timeline,
    tracks missing gaps, and safely interpolates target cells.
    """
    # 1. Parse and sort chronologically
    df_clean = df[[date_col, target_col]].copy()
    df_clean[date_col] = pd.to_datetime(df_clean[date_col], errors="coerce")
    df_clean = df_clean.dropna(subset=[date_col]).sort_values(date_col)
    
    # 2. Group duplicate date stamps
    grouped = df_clean.groupby(date_col)[target_col].mean()
    
    if len(grouped) < 3:
        raise ValueError("Dataset has insufficient unique dates to format a timeline.")
        
    # 3. Create complete timeline index
    start_date = grouped.index.min()
    end_date = grouped.index.max()
    
    pd_freq = FREQ_MAP.get(frequency)
    if not pd_freq:
        # Fall back to inferred or default to Daily
        pd_freq = pd.infer_freq(grouped.index) or "D"
        
    complete_idx = pd.date_range(start=start_date, end=end_date, freq=pd_freq)
    
    # Reindex to insert missing dates
    reindexed = grouped.reindex(complete_idx)
    
    # 4. Analyze missingness gaps
    is_null_mask = reindexed.isnull()
    missing_count = int(is_null_mask.sum())
    
    # Calculate largest consecutive missing gap size
    largest_gap = 0
    if missing_count > 0:
        # Group adjacent identical boolean statuses
        consec_groups = (is_null_mask != is_null_mask.shift()).cumsum()
        largest_gap = int(is_null_mask.groupby(consec_groups).sum().max())
        
    # Define thresholds for warnings
    warning = None
    if largest_gap > 3:
        warning = f"Large gap of {largest_gap} consecutive missing dates detected. Forecasting results may be less reliable."
    elif missing_count > 0:
        pass
        
    # 5. Interpolate target missing cells (safe for fitting estimators)
    # We use linear interpolation, backfilling/forward-filling residual boundary NaNs
    interpolated = reindexed.interpolate(method="linear").fillna(method="bfill").fillna(method="ffill")
    
    metadata = {
        "missing_periods": missing_count,
        "largest_gap": largest_gap,
        "interpolation_used": missing_count > 0,
        "warning": warning,
        "frequency_used": frequency,
        "total_observations": len(interpolated)
    }
    
    return interpolated, metadata

def train_validation_split(
    series: pd.Series, 
    horizon: int
) -> Tuple[pd.Series, pd.Series]:
    """
    Chronological split dividing series into training data and validation holdout.
    Validation size is determined by the forecast horizon (capped at 30% of data).
    """
    n_samples = len(series)
    val_size = horizon
    
    # Cap validation to prevent emptying the training subset
    max_val = int(n_samples * 0.3)
    if val_size > max_val:
        val_size = max(1, max_val)
        
    train_split = series.iloc[:-val_size]
    val_split = series.iloc[-val_size:]
    
    return train_split, val_split
