import numpy as np
import pandas as pd
from typing import Tuple
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings

class SarimaModel:
    def __init__(self, seasonal_period: int = 12):
        self.seasonal_period = seasonal_period
        self.p, self.d, self.q = 1, 1, 1
        self.P, self.D, self.Q = 1, 1, 1
        self.fitted_model = None
        
    def fit(self, y: pd.Series):
        """
        Fits a SARIMAX seasonal model, grid searching seasonal terms to minimize AIC.
        """
        # Ensure we have at least 2 seasonal cycles to estimate parameters
        min_required = 2 * self.seasonal_period
        if len(y) < min_required:
            raise ValueError(
                f"SARIMA requires at least {min_required} observations to fit seasonal period {self.seasonal_period} (got {len(y)})."
            )
            
        best_aic = float("inf")
        best_order = ((1, 1, 1), (1, 1, 1, self.seasonal_period))
        best_fitted = None
        
        # Grid search: constrain order boundaries for performance
        # p, d, q in [0, 1] and P, D, Q in [0, 1]
        for p in [0, 1]:
            for d in [0, 1]:
                for q in [0, 1]:
                    for P in [0, 1]:
                        for D in [0, 1]:
                            for Q in [0, 1]:
                                try:
                                    with warnings.catch_warnings():
                                        warnings.simplefilter("ignore")
                                        model = SARIMAX(
                                            y, 
                                            order=(p, d, q),
                                            seasonal_order=(P, D, Q, self.seasonal_period),
                                            enforce_stationarity=False,
                                            enforce_invertibility=False
                                        )
                                        fitted = model.fit(disp=False)
                                        if fitted.aic < best_aic:
                                            best_aic = fitted.aic
                                            best_order = ((p, d, q), (P, D, Q, self.seasonal_period))
                                            best_fitted = fitted
                                except Exception:
                                    continue
                                    
        if best_fitted is not None:
            (self.p, self.d, self.q), (self.P, self.D, self.Q, _) = best_order
            self.fitted_model = best_fitted
        else:
            # Fallback to standard seasonal order
            try:
                model = SARIMAX(
                    y,
                    order=(1, 1, 1),
                    seasonal_order=(1, 1, 1, self.seasonal_period),
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                self.fitted_model = model.fit(disp=False)
            except Exception as e:
                raise ValueError(f"SARIMA fitting failed on all grid iterations and fallback: {str(e)}")
                
    def predict(self, steps: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.fitted_model is None:
            raise ValueError("SARIMA model has not been fitted yet.")
            
        forecast_res = self.fitted_model.get_forecast(steps=steps)
        predictions = forecast_res.predicted_mean.values
        
        conf_int = forecast_res.conf_int(alpha=0.05)
        ci_lower = conf_int.iloc[:, 0].values
        ci_upper = conf_int.iloc[:, 1].values
        
        return predictions, ci_lower, ci_upper
