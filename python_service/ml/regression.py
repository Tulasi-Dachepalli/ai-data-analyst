import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from typing import Dict, Any, List, Tuple

def train_regression_models(
    df: pd.DataFrame,
    target: str,
    features: List[str],
    preprocessor: Any,
    test_size: float = 0.2,
    cv_folds: int = 5,
    random_state: int = 42
) -> Dict[str, Any]:
    X = df[features]
    y = df[target]
    
    # 1. Validation checks
    if y.nunique() <= 1:
        raise ValueError(f"Target column '{target}' must have some numerical variation. Got 1 unique value.")
        
    # 2. Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=test_size, 
        random_state=random_state
    )
    
    # 3. Fit preprocessor on training data ONLY to prevent leakage
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Define models
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(random_state=random_state, n_estimators=100)
    }
    
    model_results = {}
    best_model_name = None
    best_r2 = -float('inf')
    
    # 4. Fit and cross-validate
    cv_strategy = KFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
    
    for name, reg in models.items():
        # Evaluate model performance using Cross Validation on X_train (R2 metric)
        try:
            cv_scores = cross_val_score(reg, X_train_proc, y_train, cv=cv_strategy, scoring="r2")
            cv_mean = float(np.mean(cv_scores))
        except Exception:
            cv_mean = 0.0
            
        # Fit on whole train set
        reg.fit(X_train_proc, y_train)
        
        # Predict test set
        preds = reg.predict(X_test_proc)
        
        # Calculate test metrics
        mae = float(mean_absolute_error(y_test, preds))
        mse = float(mean_squared_error(y_test, preds))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, preds))
        
        model_results[name] = {
            "model_obj": reg,
            "metrics": {
                "mae": round(mae, 3),
                "mse": round(mse, 3),
                "rmse": round(rmse, 3),
                "r2": round(r2, 3),
                "cv_r2": round(cv_mean, 3)
            }
        }
        
        if cv_mean > best_r2:
            best_r2 = cv_mean
            best_model_name = name
            
    # Build complete pipeline package for the selected best model
    best_reg = model_results[best_model_name]["model_obj"]
    final_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', best_reg)
    ])
    
    formatted_comparisons = {}
    for name, r in model_results.items():
        formatted_comparisons[name] = r["metrics"]
        
    return {
        "task_type": "regression",
        "best_model": best_model_name,
        "recommendation_reason": f"Selected '{best_model_name}' because it achieved the highest macro R² validation score ({best_r2:.2f}) during {cv_folds}-fold cross validation.",
        "comparisons": formatted_comparisons,
        "pipeline": final_pipeline,
        "training_rows": len(X_train)
    }
