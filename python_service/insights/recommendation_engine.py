from typing import List, Dict, Any, Tuple
import numpy as np

def generate_recommendations(profile: Dict[str, Any], columns_list: List[str]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    recommendations = []
    target_recommendations = []
    
    quality_score = profile.get("quality_score", 100.0)
    columns_info = profile.get("columns_info", [])
    
    # 1. Evaluate Data Cleaning Priority
    if quality_score < 60.0:
        recommendations.append({
            "recommendation": "DATA_CLEANING",
            "priority": "high",
            "reason": f"Overall dataset data quality is low ({quality_score:.1f}%).",
            "action": "Clean the dataset using automated whitespace normalization, duplicate removal, and median null value imputation.",
            "why": [
                "Overall quality is below the 60% threshold.",
                "Missing values or duplicates can severely bias machine learning models.",
                "Lineage tracking ensures safe reversion to original state."
            ]
        })
    elif quality_score < 85.0:
        recommendations.append({
            "recommendation": "DATA_CLEANING",
            "priority": "medium",
            "reason": f"Overall dataset data quality has minor issues ({quality_score:.1f}%).",
            "action": "Examine dirty column records or perform soft gap imputation.",
            "why": [
                "Some columns contain sparse rows or outlier cells.",
                "Standardizing formats will improve statistical correlation metrics."
            ]
        })

    # 2. Target Variable Analysis (Classification vs Regression Candidates)
    date_col = None
    potential_targets = []
    
    for col_info in columns_info:
        col_name = col_info.get("name")
        dtype = col_info.get("dtype", "").lower()
        nulls = col_info.get("nulls", 0)
        unique_cnt = col_info.get("unique_count", 0)
        outliers = col_info.get("outlier_count", 0)
        
        # Detect Date column
        if "date" in dtype or "time" in dtype or "date" in col_name.lower() or "timestamp" in col_name.lower():
            if not date_col:
                date_col = col_name
            continue
            
        if col_name.lower() in ["id", "uuid", "index", "key", "pk", "fk"]:
            continue
            
        # Target heuristics
        total_rows = profile.get("rows", 1)
        if total_rows > 0:
            unique_ratio = unique_cnt / total_rows
        else:
            unique_ratio = 1.0
            
        # Classification target candidate
        if 2 <= unique_cnt <= 20 and unique_ratio < 0.2:
            confidence = 0.8
            if col_name.lower() in ["label", "target", "category", "class", "status", "stage"]:
                confidence = 0.95
            potential_targets.append((col_name, "classification", confidence))
            target_recommendations.append({
                "column": col_name,
                "confidence": confidence
            })
            
        # Regression target candidate
        elif unique_cnt > 10 and unique_ratio > 0.01:
            if "int" in dtype or "float" in dtype:
                confidence = 0.6
                if col_name.lower() in ["revenue", "sales", "profit", "cost", "amount", "price"]:
                    confidence = 0.9
                potential_targets.append((col_name, "regression", confidence))
                target_recommendations.append({
                    "column": col_name,
                    "confidence": confidence
                })

    # Sort target candidates by confidence
    potential_targets.sort(key=lambda x: x[2], reverse=True)
    target_recommendations.sort(key=lambda x: x["confidence"], reverse=True)

    # 3. Evaluate Forecasting Option
    continuous_numeric_col = None
    for name, task, conf in potential_targets:
        if task == "regression" and conf >= 0.8:
            continuous_numeric_col = name
            break
            
    if date_col and continuous_numeric_col:
        recommendations.append({
            "recommendation": "FORECASTING",
            "priority": "high",
            "reason": f"A chronological date index '{date_col}' and continuous target variable '{continuous_numeric_col}' were detected.",
            "action": f"Train time-series forecasting models on '{continuous_numeric_col}' over date index '{date_col}'.",
            "why": [
                "Enables Naive, Moving Average, ARIMA, and SARIMA models comparators.",
                "Enforces chronological train/validation holdout checks.",
                "Provides shaded 95% confidence future interval boundaries."
            ]
        })
    elif date_col:
        recommendations.append({
            "recommendation": "FORECASTING",
            "priority": "medium",
            "reason": f"A date timestamp column '{date_col}' was found, but no explicit high-confidence continuous revenue target was mapped.",
            "action": f"Identify a continuous numeric variable to configure forecasting projections.",
            "why": [
                "Requires both a time dimension and a continuous outcome vector to project timelines."
            ]
        })

    # 4. Evaluate Supervised Machine Learning Recommendations
    if potential_targets:
        top_name, top_task, top_conf = potential_targets[0]
        rec_type = "AUTOML_CLASSIFICATION" if top_task == "classification" else "AUTOML_REGRESSION"
        
        recommendations.append({
            "recommendation": rec_type,
            "priority": "high" if top_conf >= 0.8 else "medium",
            "reason": f"Detected potential target '{top_name}' suitable for {top_task} modeling (Confidence: {int(top_conf * 100)}%).",
            "action": f"Configure AutoML {top_task.capitalize()} modeling focusing on target '{top_name}'.",
            "why": [
                f"Automates feature preprocessing pipeline for predicting {top_name}.",
                "Compares Random Forest, Linear models, and gradient boosting trees.",
                "Extracts Gini-impurity explainability feature importance importances."
            ]
        })

    # 5. Fallback Clustering / EDA Recommendation
    recommendations.append({
        "recommendation": "EDA",
        "priority": "medium" if len(recommendations) > 0 else "high",
        "reason": "The dataset contains multiple numeric and categorical combinations.",
        "action": "Examine Automated EDA plots and Statistics metrics to explore bivariate correlations.",
        "why": [
            "Generates cross-column scatter plots and category counts instantly.",
            "Identifies Pearson correlation pairs visually.",
            "Helps map out distributions and count anomalies."
        ]
    })
    
    # Sort recommendations by priority (high first)
    recommendations.sort(key=lambda x: 0 if x["priority"] == "high" else (1 if x["priority"] == "medium" else 2))
    return recommendations, target_recommendations
