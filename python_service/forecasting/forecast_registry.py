import os
import joblib
from typing import Any

# Resolve local storage directory safely
STORAGE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
    "storage", 
    "forecasts"
)

def save_forecast_model(model: Any, model_id: int) -> str:
    """
    Serializes a trained forecast model pipeline to disk.
    """
    os.makedirs(STORAGE_DIR, exist_ok=True)
    
    # Secure filename creation using integer ID mapping
    filename = f"forecast_{int(model_id)}.joblib"
    file_path = os.path.join(STORAGE_DIR, filename)
    
    joblib.dump(model, file_path)
    return file_path

def load_forecast_model(model_id: int) -> Any:
    """
    Loads a trained forecast model pipeline from disk.
    """
    filename = f"forecast_{int(model_id)}.joblib"
    file_path = os.path.join(STORAGE_DIR, filename)
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Forecast model registry file not found: {file_path}")
        
    return joblib.load(file_path)
