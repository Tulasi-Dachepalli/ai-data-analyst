import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any
from statsmodels.tsa.arima.model import ARIMA
import warnings

class ArimaModel:
    def __init__(self):
        self.p = 1
        self.d = 1
        self.q = 1
        self.fitted_model = None
        
    def fit(self, y: pd.Series):
        """
        Runs a grid search over (p, d, q) space to identify the parameter set
        minimizing the Akaike Information Criterion (AIC).
        """
        if len(y) < 5:
            raise ValueError("ARIMA requires at least 5 observations to fit.")
            
        best_aic = float("inf")
        best_order = (1, 1, 1)
        best_fitted = None
        
        # Constrain parameter grids to prevent excessive compute times
        # p = 0..1, d = 0..1, q = 0..1
        for p in [0, 1]:
            for d in [0, 1]:
                for q in [0, 1]:
                    try:
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore")
                            model = ARIMA(y, order=(p, d, q))
                            fitted = model.fit()
                            if fitted.aic < best_aic:
                                best_aic = fitted.aic
                                best_order = (p, d, q)
                                best_fitted = fitted
                    except Exception:
                        continue
                        
        if best_fitted is not None:
            self.p, self.d, self.q = best_order
            self.fitted_model = best_fitted
        else:
            # Fall back to base order if all grid searches failed (e.g. convergence error)
            try:
                model = ARIMA(y, order=(1, 1, 1))
                self.fitted_model = model.fit()
                self.p, self.d, self.q = (1, 1, 1)
            except Exception as e:
                raise ValueError(f"ARIMA fitting failed on all grid iterations and fallback: {str(e)}")
                
    def predict(self, steps: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.fitted_model is None:
            raise ValueError("ARIMA model has not been fitted yet.")
            
        # Get forecasted mean and confidence intervals
        forecast_res = self.fitted_model.get_forecast(steps=steps)
        predictions = forecast_res.predicted_mean.values
        
        conf_int = forecast_res.conf_int(alpha=0.05)
        ci_lower = conf_int.iloc[:, 0].values
        ci_upper = conf_int.iloc[:, 1].values
        
        return predictions, ci_lower, ci_upper
