import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, KFold, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.pipeline import Pipeline
from typing import Dict, Any, List, Tuple

def train_classification_models(
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
    unique_classes = y.nunique()
    if unique_classes <= 1:
        raise ValueError(f"Target column '{target}' must have at least 2 classes. Got {unique_classes}.")
        
    class_counts = y.value_counts()
    min_class_count = class_counts.min()
    
    # 2. Stratified train-test split (fallback to non-stratified if class count < 2)
    stratify_y = y if min_class_count >= 2 else None
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=test_size, 
        random_state=random_state, 
        stratify=stratify_y
    )
    
    # 3. Fit preprocessor on training data ONLY to prevent leakage
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Define models
    models = {
        "Logistic Regression": LogisticRegression(random_state=random_state, max_iter=1000),
        "Random Forest": RandomForestClassifier(random_state=random_state, n_estimators=100)
    }
    
    model_results = {}
    best_model_name = None
    best_f1 = -1.0
    
    # 4. Fit and cross-validate
    # Use StratifiedKFold for classification CV
    cv_strategy = StratifiedKFold(n_splits=min(cv_folds, min_class_count), shuffle=True, random_state=random_state) \
        if min_class_count >= min(cv_folds, 2) else KFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
        
    for name, clf in models.items():
        # Evaluate model performance using Cross Validation on X_train
        try:
            cv_scores = cross_val_score(clf, X_train_proc, y_train, cv=cv_strategy, scoring="f1_macro")
            cv_mean = float(np.mean(cv_scores))
        except Exception:
            # Fallback score if cross_val fails (e.g. tiny sample count)
            cv_mean = 0.0
            
        # Fit on whole train set
        clf.fit(X_train_proc, y_train)
        
        # Predict test set
        preds = clf.predict(X_test_proc)
        
        # Calculate test metrics
        # Use macro averaging to support multi-class datasets without bias
        acc = float(accuracy_score(y_test, preds))
        prec = float(precision_score(y_test, preds, average="macro", zero_division=0))
        rec = float(recall_score(y_test, preds, average="macro", zero_division=0))
        f1 = float(f1_score(y_test, preds, average="macro", zero_division=0))
        
        # Confusion matrix coordinate counts
        cm = confusion_matrix(y_test, preds).tolist()
        
        # Save fitted model for registry packaging later
        model_results[name] = {
            "model_obj": clf,
            "metrics": {
                "accuracy": round(acc, 3),
                "precision": round(prec, 3),
                "recall": round(rec, 3),
                "f1": round(f1, 3),
                "cv_f1": round(cv_mean, 3),
                "confusion_matrix": cm
            }
        }
        
        if cv_mean > best_f1:
            best_f1 = cv_mean
            best_model_name = name
            
    # Build complete pipeline package for the selected best model
    best_clf = model_results[best_model_name]["model_obj"]
    final_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', best_clf)
    ])
    
    # Return formatted comparisons
    formatted_comparisons = {}
    for name, r in model_results.items():
        formatted_comparisons[name] = r["metrics"]
        
    return {
        "task_type": "classification",
        "best_model": best_model_name,
        "recommendation_reason": f"Selected '{best_model_name}' because it achieved the highest macro F1 validation score ({best_f1:.2f}) during {cv_folds}-fold cross validation.",
        "comparisons": formatted_comparisons,
        "pipeline": final_pipeline,
        "classes": [str(c) for c in clf.classes_],
        "training_rows": len(X_train)
    }
