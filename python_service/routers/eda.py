from fastapi import APIRouter, HTTPException
import pandas as pd
from models.schemas import CleanRequest, EdaResponse, SingleChart
from services.eda_service import generate_eda_charts

router = APIRouter()

@router.post("/eda", response_model=EdaResponse)
async def get_eda(payload: CleanRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows array is empty.")
        
    try:
        # Load JSON rows into standard Pandas DataFrame
        df = pd.DataFrame(payload.rows)
        # Subset columns
        if payload.columns:
            existing_cols = [c for c in payload.columns if c in df.columns]
            df = df[existing_cols]
            
        charts_data = generate_eda_charts(df)
        
        # Format response to match schemas
        charts = []
        for chart in charts_data:
            charts.append(SingleChart(
                type=chart["type"],
                title=chart["title"],
                xAxis=chart["xAxis"],
                yAxis=chart["yAxis"],
                data=chart["data"]
            ))
            
        return EdaResponse(charts=charts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"EDA recommendation generation failed: {str(e)}")
