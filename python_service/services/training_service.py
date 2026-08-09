import pandas as pd
import numpy as np
from typing import Dict, Any, List
from ml.task_detector import detect_ml_tasks
from ml.preprocessing import build_preprocessing_pipeline
from ml.classification import train_classification_models
from ml.regression import train_regression_models
from ml.clustering import train_clustering_model
from ml.evaluation import get_feature_importances
from ml.model_registry import save_model_pipeline, load_model_pipeline

def run_task_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    return detect_ml_tasks(df)

def train_selected_model(
    df: pd.DataFrame,
    task_type: str,
    target: str,
    features: List[str],
    model_id: int,
    test_size: float = 0.2,
    cv_folds: int = 5,
    random_state: int = 42
) -> Dict[str, Any]:
    # 1. Clean columns headers and ensure predictors exist in dataframe
    df.columns = [str(c).strip() for c in df.columns]
    features = [str(f).strip() for f in features if str(f).strip() in df.columns]
    
    if not features:
        raise ValueError("No valid feature columns provided for model fitting.")
        
    # 2. Build preprocessing column pipeline
    preprocessor, num_cols, cat_cols, date_cols = build_preprocessing_pipeline(df, features)
    
    # 3. Train based on task type selection
    if task_type == "classification":
        if not target:
            raise ValueError("Target column is required for Classification tasks.")
        target = str(target).strip()
        
        result = train_classification_models(
            df=df, target=target, features=features, preprocessor=preprocessor,
            test_size=test_size, cv_folds=cv_folds, random_state=random_state
        )
        
    elif task_type == "regression":
        if not target:
            raise ValueError("Target column is required for Regression tasks.")
        target = str(target).strip()
        
        result = train_regression_models(
            df=df, target=target, features=features, preprocessor=preprocessor,
            test_size=test_size, cv_folds=cv_folds, random_state=random_state
        )
        
    elif task_type == "clustering":
        result = train_clustering_model(
            df=df, features=features, preprocessor=preprocessor,
            random_state=random_state
        )
        
    else:
        raise ValueError(f"Unsupported machine learning task type: {task_type}")
        
    # 4. Serialize and register the best fitted pipeline
    pipeline = result["pipeline"]
    save_model_pipeline(pipeline, model_id)
    
    # 5. Extract explainability feature importances
    feature_importances = []
    if task_type != "clustering":
        feature_importances = get_feature_importances(pipeline, features)
        
    # Build returned payload (exclude the non-serializable binary object)
    return {
        "success": True,
        "model_id": model_id,
        "task_type": task_type,
        "best_model": result.get("best_model") or f"K-Means (k={result.get('best_k')})",
        "recommendation_reason": result.get("recommendation_reason", ""),
        "comparisons": result.get("comparisons", {}),
        "cluster_sizes": result.get("cluster_sizes", {}),
        "feature_importances": feature_importances,
        "training_rows": result.get("training_rows", len(df)),
        "best_k": result.get("best_k")
    }

def generate_predictions(model_id: int, rows: List[Dict[str, Any]]) -> List[Any]:
    if not rows:
        raise ValueError("Input rows array is empty.")
        
    # 1. Load serialized pipeline (preprocessor + model)
    pipeline = load_model_pipeline(model_id)
    
    # 2. Convert rows list to DataFrame
    df_pred = pd.DataFrame(rows)
    
    # 3. Classify and transform input rows
    predictions = pipeline.predict(df_pred)
    
    # Convert numpy types to native Python types for clean JSON response
    return [
        int(p) if isinstance(p, (np.integer, np.bool_)) 
        else float(p) if isinstance(p, np.floating)
        else str(p) 
        for p in predictions
    ]
