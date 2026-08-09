from fastapi import APIRouter, HTTPException
import pandas as pd
from models.schemas import (
    CleanRequest, MlAnalyzeResponse,
    MlTrainRequest, MlTrainResponse,
    MlPredictRequest, MlPredictResponse
)
from services.training_service import (
    run_task_analysis,
    train_selected_model,
    generate_predictions
)

router = APIRouter()

@router.post("/ml/analyze", response_model=MlAnalyzeResponse)
async def analyze_dataset_tasks(payload: CleanRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Dataset rows array is empty.")
        
    try:
        df = pd.DataFrame(payload.rows)
        if payload.columns:
            existing_cols = [c for c in payload.columns if c in df.columns]
            df = df[existing_cols]
            
        analysis = run_task_analysis(df)
        return MlAnalyzeResponse(**analysis)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ML analysis failed: {str(e)}")

@router.post("/ml/train", response_model=MlTrainResponse)
async def train_dataset_model(payload: MlTrainRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Training rows array is empty.")
        
    try:
        df = pd.DataFrame(payload.rows)
        # Ensure selected columns exist
        if payload.columns:
            existing_cols = [c for c in payload.columns if c in df.columns]
            df = df[existing_cols]
            
        results = train_selected_model(
            df=df,
            task_type=payload.task_type,
            target=payload.target,
            features=payload.features,
            model_id=payload.model_id,
            test_size=payload.test_size,
            cv_folds=payload.cv_folds
        )
        return MlTrainResponse(**results)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Model training failed: {str(e)}")

@router.post("/ml/predict", response_model=MlPredictResponse)
async def predict_dataset_rows(payload: MlPredictRequest):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Prediction input rows array is empty.")
        
    try:
        predictions = generate_predictions(payload.model_id, payload.rows)
        return MlPredictResponse(model_id=payload.model_id, predictions=predictions)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Predictions generation failed: {str(e)}")
