from fastapi import APIRouter, HTTPException
import pandas as pd
from models.schemas import (
    ForecastAnalyzeRequest, 
    ForecastAnalyzeResponse,
    ForecastTrainRequest,
    ForecastTrainResponse
)
from forecasting.detector import analyze_forecasting_suitability
from forecasting.forecasting_service import train_best_forecast_pipeline

router = APIRouter()

@router.post("/forecast/analyze", response_model=ForecastAnalyzeResponse)
def analyze_forecasting_endpoint(payload: ForecastAnalyzeRequest):
    """
    Scans a dataset's columns and rows to check suitability for forecasting,
    detect candidate date/target fields, frequency, and seasonality.
    """
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Input rows array is empty.")
        
    df = pd.DataFrame(payload.rows)
    try:
        results = analyze_forecasting_suitability(df)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Forecasting suitability analysis failed: {str(e)}"
        )

@router.post("/forecast/train", response_model=ForecastTrainResponse)
def train_forecasting_endpoint(payload: ForecastTrainRequest):
    """
    Trains Naive, MA, ARIMA, and SARIMA models, selects the best using time-ordered
    validation holdouts, retrains on all history, and outputs forecasts.
    """
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Input rows array is empty.")
        
    df = pd.DataFrame(payload.rows)
    
    if payload.horizon <= 0:
        raise HTTPException(status_code=400, detail="Forecast horizon must be a positive integer.")
        
    if payload.date_column not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail=f"Date column '{payload.date_column}' not found in dataset."
        )
        
    if payload.target_column not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail=f"Target column '{payload.target_column}' not found in dataset."
        )
        
    try:
        res = train_best_forecast_pipeline(
            df=df,
            date_col=payload.date_column,
            target_col=payload.target_column,
            frequency=payload.frequency,
            horizon=payload.horizon,
            model_id=payload.model_id
        )
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Time-series model training failed: {str(e)}"
        )
