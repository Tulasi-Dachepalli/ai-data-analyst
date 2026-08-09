import pandas as pd
import numpy as np
from typing import Dict, Any, List
from forecasting.detector import analyze_forecasting_suitability
from forecasting.preprocessing import prepare_time_series, train_validation_split, FREQ_MAP
from forecasting.baseline import NaiveBaseline, MovingAverageBaseline
from forecasting.arima import ArimaModel
from forecasting.sarima import SarimaModel
from forecasting.evaluation import calculate_forecasting_metrics
from forecasting.forecast_registry import save_forecast_model

def train_best_forecast_pipeline(
    df: pd.DataFrame,
    date_col: str,
    target_col: str,
    frequency: str,
    horizon: int,
    model_id: int
) -> Dict[str, Any]:
    """
    Fits baseline and ARIMA/SARIMA models, compares their validation performance,
    retrains the winner on full data, serializes it, and outputs future predictions.
    """
    # 1. Preprocess and align index
    series, preprocess_meta = prepare_time_series(df, date_col, target_col, frequency)
    n_samples = len(series)
    
    # 2. Train / Validation split
    train_split, val_split = train_validation_split(series, horizon)
    val_steps = len(val_split)
    
    # Analyze suitability for seasonality
    suitability = analyze_forecasting_suitability(df)
    seasonality_detected = suitability.get("seasonality_details", {}).get("seasonality_detected", False)
    seasonal_period = suitability.get("seasonality_details", {}).get("seasonal_period")
    
    comparisons = {}
    models_pool = {}
    
    # A. Naive baseline
    try:
        naive = NaiveBaseline()
        naive.fit(train_split)
        pred, _, _ = naive.predict(val_steps)
        comparisons["Naive"] = calculate_forecasting_metrics(val_split, pred)
        models_pool["Naive"] = naive
    except Exception:
        pass
        
    # B. Moving Average baseline
    try:
        ma = MovingAverageBaseline(window=3)
        ma.fit(train_split)
        pred, _, _ = ma.predict(val_steps)
        comparisons["Moving Average"] = calculate_forecasting_metrics(val_split, pred)
        models_pool["Moving Average"] = ma
    except Exception:
        pass
        
    # C. ARIMA model
    try:
        arima = ArimaModel()
        arima.fit(train_split)
        pred, _, _ = arima.predict(val_steps)
        comparisons["ARIMA"] = calculate_forecasting_metrics(val_split, pred)
        models_pool["ARIMA"] = arima
    except Exception:
        pass
        
    # D. SARIMA model (only if seasonality is flagged and dataset is large enough)
    if seasonality_detected and seasonal_period and len(train_split) >= (2 * seasonal_period):
        try:
            sarima = SarimaModel(seasonal_period=seasonal_period)
            sarima.fit(train_split)
            pred, _, _ = sarima.predict(val_steps)
            comparisons["SARIMA"] = calculate_forecasting_metrics(val_split, pred)
            models_pool["SARIMA"] = sarima
        except Exception:
            pass
            
    if not comparisons:
        raise ValueError("All candidate forecasting models failed to fit.")
        
    # 3. Model selection based on validation set RMSE (with MAE as fallback tiebreaker)
    best_algo = min(comparisons.keys(), key=lambda k: (comparisons[k]["rmse"], comparisons[k]["mae"]))
    
    # 4. Retrain best model on ALL historical series values
    best_model = models_pool[best_algo]
    best_model.fit(series)
    
    # 5. Save model pipeline
    save_forecast_model(best_model, model_id)
    
    # 6. Generate future forecasts with confidence bounds
    future_pred, ci_lower, ci_upper = best_model.predict(horizon)
    
    # 7. Generate future forecast timestamp indices
    last_date = series.index[-1]
    pd_freq = FREQ_MAP.get(frequency, "D")
    future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq=pd_freq)[1:]
    
    # 8. Forecast Narrative Insights
    trend = "increasing" if future_pred[-1] > series.iloc[-1] else "decreasing"
    
    denom = series.iloc[-1]
    pct_growth = round(((future_pred[-1] - denom) / denom) * 100.0, 2) if denom != 0 else 0.0
    
    smape_score = comparisons[best_algo]["smape"]
    if smape_score < 8.0:
        uncertainty = "low"
    elif smape_score < 15.0:
        uncertainty = "moderate"
    else:
        uncertainty = "high"
        
    # Build React-ready payload structures
    historical_list = [{"date": str(d.date()), "actual": float(v)} for d, v in series.items()]
    
    forecast_list = []
    for idx, d in enumerate(future_dates):
        forecast_list.append({
            "date": str(d.date()),
            "predicted": float(round(future_pred[idx], 2)),
            "lower": float(round(ci_lower[idx], 2)),
            "upper": float(round(ci_upper[idx], 2))
        })
        
    return {
        "success": True,
        "model_id": model_id,
        "algorithm": best_algo,
        "frequency": frequency,
        "metrics": comparisons[best_algo],
        "comparisons": comparisons,
        "historical": historical_list,
        "forecast": forecast_list,
        "preprocessing_metadata": preprocess_meta,
        "insights": {
            "trend": trend,
            "expected_growth": pct_growth,
            "uncertainty": uncertainty,
            "seasonal_period": seasonal_period if seasonality_detected else None
        },
        "training_rows": n_samples,
        "validation_rows": val_steps,
        "training_start": str(series.index.min().date()),
        "training_end": str(series.index.max().date())
    }
