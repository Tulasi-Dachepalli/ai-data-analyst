from fastapi import APIRouter, HTTPException
import pandas as pd
from models.schemas import CleanRequest, CleanResponse, CleanChanges
from services.cleaning_service import clean_dataframe

router = APIRouter()

@router.post("/clean", response_model=CleanResponse)
async def clean_dataset(payload: CleanRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows array is empty.")
        
    try:
        # Load JSON rows into standard Pandas DataFrame
        df = pd.DataFrame(payload.rows)
        # Ensure column subset alignment
        if payload.columns:
            # Keep only existing keys in payload.columns
            existing_cols = [c for c in payload.columns if c in df.columns]
            df = df[existing_cols]
            
        cleaned = clean_dataframe(df)
        
        changes = CleanChanges(
            duplicates_removed=cleaned["duplicates_removed"],
            missing_values_filled=cleaned["missing_values_filled"],
            whitespace_normalized=cleaned["whitespace_normalized"],
            empty_columns_removed=cleaned["empty_columns_removed"],
            constant_columns_removed=cleaned["constant_columns_removed"]
        )
        
        return CleanResponse(
            success=True,
            original_rows=cleaned["original_rows"],
            cleaned_rows=cleaned["cleaned_rows"],
            original_columns=cleaned["original_columns"],
            cleaned_columns=cleaned["cleaned_columns"],
            changes=changes,
            cleaned_data=cleaned["cleaned_data"],
            columns_list=cleaned["columns_list"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data cleaning failed: {str(e)}")
