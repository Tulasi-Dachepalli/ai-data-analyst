import numpy as np
from typing import List, Dict, Any

def get_feature_importances(pipeline: Any, feature_cols: List[str]) -> List[Dict[str, Any]]:
    try:
        preprocessor = pipeline.named_steps['preprocessor']
        estimator = pipeline.steps[-1][1]
        
        # Get output feature names from the fitted preprocessor
        feature_names = list(preprocessor.get_feature_names_out())
        raw_importances = None
        
        if hasattr(estimator, 'feature_importances_'):
            raw_importances = estimator.feature_importances_
        elif hasattr(estimator, 'coef_'):
            coefs = estimator.coef_
            if len(coefs.shape) > 1: # Multi-class coefficients matrix average
                raw_importances = np.mean(np.abs(coefs), axis=0)
            else:
                raw_importances = np.abs(coefs)
                
        if raw_importances is not None:
            # Map names to scores
            importances_dict = {}
            for name, imp in zip(feature_names, raw_importances):
                # Remove sklearn column transformer prefixes (e.g. num__x, cat__x)
                clean_name = name.split("__")[-1]
                importances_dict[clean_name] = float(imp)
                
            # Aggregate expanded categorical levels back to original feature name
            aggregated = {}
            for original_col in feature_cols:
                # Sum importance of all encoding levels
                matches = [
                    v for k, v in importances_dict.items() 
                    if k == original_col or k.startswith(original_col + "_")
                ]
                if matches:
                    aggregated[original_col] = sum(matches)
                else:
                    aggregated[original_col] = 0.0
                    
            # Normalize to sum up to 1.0
            total = sum(aggregated.values())
            if total > 0:
                for k in aggregated:
                    aggregated[k] = round(aggregated[k] / total, 3)
            else:
                # Distribute equally if all importances are zero
                n = len(feature_cols)
                for k in aggregated:
                    aggregated[k] = round(1.0 / n, 3)
                    
            # Sort importances descending
            sorted_imp = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)
            return [{"feature": k, "importance": v} for k, v in sorted_imp]
            
    except Exception as e:
        print("Feature importance mapping failed:", e)
        
    # Equal distribution fallback
    n = len(feature_cols)
    return [{"feature": col, "importance": round(1.0 / n, 3)} for col in feature_cols]
