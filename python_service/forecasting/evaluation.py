import numpy as np
from typing import Dict, Any

def calculate_forecasting_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """
    Computes standard forecasting error bounds.
    If actual values contain 0, MAPE is disabled while sMAPE is safely evaluated.
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    
    if len(y_true) == 0:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "smape": 0.0,
            "mape": None,
            "mape_valid": False
        }
        
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    
    # Symmetric MAPE formula protects against divide by zero
    denominator = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    # Avoid zero division inside terms
    non_zero_denom = denominator != 0
    smape_terms = np.zeros_like(denominator)
    smape_terms[non_zero_denom] = (np.abs(y_pred[non_zero_denom] - y_true[non_zero_denom]) / denominator[non_zero_denom]) * 100.0
    smape = float(np.mean(smape_terms))
    
    # Standard MAPE validation check
    has_zeros = bool(np.any(y_true == 0))
    if not has_zeros:
        mape = float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100.0)
    else:
        mape = None
        
    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "smape": round(smape, 2),
        "mape": round(mape, 2) if mape is not None else None,
        "mape_valid": not has_zeros
    }
