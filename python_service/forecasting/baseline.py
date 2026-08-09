import numpy as np
import pandas as pd
from typing import Tuple

class NaiveBaseline:
    def __init__(self):
        self.last_value = None
        self.residuals_std = 0.0
        
    def fit(self, y: pd.Series):
        if len(y) == 0:
            raise ValueError("Training series is empty.")
        self.last_value = float(y.iloc[-1])
        # Compute standard deviation of residuals for confidence intervals
        residuals = y - y.shift(1)
        self.residuals_std = float(residuals.std()) if len(y) > 2 else 1.0
        if np.isnan(self.residuals_std) or self.residuals_std == 0:
            self.residuals_std = 1.0
            
    def predict(self, steps: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        predictions = np.full(steps, self.last_value)
        
        ci_lower = []
        ci_upper = []
        # Naive forecast variance increases with step horizon
        for h in range(1, steps + 1):
            margin = 1.96 * self.residuals_std * np.sqrt(h)
            ci_lower.append(self.last_value - margin)
            ci_upper.append(self.last_value + margin)
            
        return predictions, np.array(ci_lower), np.array(ci_upper)

class MovingAverageBaseline:
    def __init__(self, window: int = 3):
        self.window = window
        self.ma_val = None
        self.residuals_std = 0.0
        
    def fit(self, y: pd.Series):
        if len(y) == 0:
            raise ValueError("Training series is empty.")
        win = min(self.window, len(y))
        self.ma_val = float(y.iloc[-win:].mean())
        
        # Residuals standard deviation
        rolling_mean = y.rolling(win).mean()
        residuals = y - rolling_mean
        self.residuals_std = float(residuals.std()) if len(y) > win else 1.0
        if np.isnan(self.residuals_std) or self.residuals_std == 0:
            self.residuals_std = 1.0
            
    def predict(self, steps: int) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        predictions = np.full(steps, self.ma_val)
        
        ci_lower = []
        ci_upper = []
        for h in range(1, steps + 1):
            margin = 1.96 * self.residuals_std * np.sqrt(h)
            ci_lower.append(self.ma_val - margin)
            ci_upper.append(self.ma_val + margin)
            
        return predictions, np.array(ci_lower), np.array(ci_upper)
