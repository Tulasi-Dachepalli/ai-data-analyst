import os
import joblib
from typing import Any

# Registry folder: python_service/storage/models/
STORAGE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "models")
)

def save_model_pipeline(pipeline: Any, model_id: int) -> str:
    os.makedirs(STORAGE_DIR, exist_ok=True)
    filename = f"model_{model_id}.joblib"
    file_path = os.path.join(STORAGE_DIR, filename)
    
    # Serialize and save binary payload
    joblib.dump(pipeline, file_path)
    return file_path

def load_model_pipeline(model_id: int) -> Any:
    filename = f"model_{model_id}.joblib"
    file_path = os.path.join(STORAGE_DIR, filename)
    
    # Enforce path containment safety checks
    abs_path = os.path.abspath(file_path)
    if not abs_path.startswith(STORAGE_DIR):
        raise ValueError("Security violation: Attempted path traversal out of model storage bounds.")
        
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Saved model registry record not found for ID: {model_id}")
        
    return joblib.load(file_path)
