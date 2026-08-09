import pandas as pd
import os
import shutil
from fastapi import UploadFile, HTTPException

def load_file_to_dataframe(upload_file: UploadFile) -> pd.DataFrame:
    file_name = upload_file.filename
    _, ext = os.path.splitext(file_name.lower())
    
    # Save uploaded file temporarily for Pandas parser execution
    temp_dir = "uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file_name)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        if ext == ".csv":
            df = pd.read_csv(temp_path)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(temp_path)
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file extension. Only CSV and Excel files are supported."
            )
            
        return df
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    finally:
        # Cleanup temporary files immediately on completion
        if os.path.exists(temp_path):
            os.remove(temp_path)
