from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from models.schemas import ProfileResponse, CleanRequest
from utils.file_loader import load_file_to_dataframe
from services.profiling_service import compute_profile

router = APIRouter()

@router.post("/profile", response_model=ProfileResponse)
async def get_profile(file: UploadFile = File(...)):
    filename = file.filename
    if not filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file type. Only CSV and Excel files are supported."
        )
        
    df = load_file_to_dataframe(file)
    profile_data = compute_profile(df)
    
    return ProfileResponse(
        rows=profile_data["rows"],
        columns=profile_data["columns"],
        duplicate_rows=profile_data["duplicate_rows"],
        missing_cells=profile_data["missing_cells"],
        missing_percentage=profile_data["missing_percentage"],
        quality_score=profile_data["quality_score"],
        columns_info=profile_data["columns_info"],
        rows_data=profile_data["rows_data"],
        columns_list=profile_data["columns_list"]
    )

@router.post("/profile-json", response_model=ProfileResponse)
async def get_profile_json(payload: CleanRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows array is empty.")
    try:
        df = pd.DataFrame(payload.rows)
        if payload.columns:
            existing_cols = [c for c in payload.columns if c in df.columns]
            df = df[existing_cols]
            
        profile_data = compute_profile(df)
        
        return ProfileResponse(
            rows=profile_data["rows"],
            columns=profile_data["columns"],
            duplicate_rows=profile_data["duplicate_rows"],
            missing_cells=profile_data["missing_cells"],
            missing_percentage=profile_data["missing_percentage"],
            quality_score=profile_data["quality_score"],
            columns_info=profile_data["columns_info"],
            rows_data=profile_data["rows_data"],
            columns_list=profile_data["columns_list"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Profiling failed: {str(e)}")
