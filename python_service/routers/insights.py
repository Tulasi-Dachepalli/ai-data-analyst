from fastapi import APIRouter, HTTPException
from models.schemas import InsightRequest, InsightsResponse
from insights.insight_engine import run_insights_engine

router = APIRouter(prefix="/insights", tags=["insights"])

@router.post("", response_model=InsightsResponse)
async def get_insights(payload: InsightRequest):
    # Empty and malformed input validations
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows list cannot be empty.")
    if not payload.columns:
        raise HTTPException(status_code=400, detail="Dataset columns list cannot be empty.")
    if not payload.profile or "columns_info" not in payload.profile:
        raise HTTPException(status_code=400, detail="Profile metadata with columns_info is required.")
    if not payload.statistics or "correlation" not in payload.statistics:
        raise HTTPException(status_code=400, detail="Statistics metadata with correlation is required.")
        
    try:
        res = run_insights_engine(
            rows=payload.rows,
            columns=payload.columns,
            profile=payload.profile,
            statistics=payload.statistics
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights calculation engine error: {str(e)}")
