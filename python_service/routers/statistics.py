from fastapi import APIRouter, HTTPException
import pandas as pd
from models.schemas import CleanRequest, StatisticsResponse
from services.statistics_service import compute_dataset_statistics

router = APIRouter()

@router.post("/statistics", response_model=StatisticsResponse)
async def get_statistics(payload: CleanRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows array is empty.")
        
    try:
        # Load JSON rows into standard Pandas DataFrame
        df = pd.DataFrame(payload.rows)
        if payload.columns:
            existing_cols = [c for c in payload.columns if c in df.columns]
            df = df[existing_cols]
            
        stats_data = compute_dataset_statistics(df)
        
        # Format relationship keys to match aliased Pydantic field: with -> with_col
        formatted_relationships = []
        for r in stats_data["correlation"]["relationships"]:
            formatted_relationships.append({
                "column": r["column"],
                "with": r["with"], # Will map to with_col via alias populate
                "value": r["value"],
                "strength": r["strength"],
                "direction": r["direction"]
            })
            
        stats_data["correlation"]["relationships"] = formatted_relationships
        return StatisticsResponse(**stats_data)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Statistics calculation failed: {str(e)}")
