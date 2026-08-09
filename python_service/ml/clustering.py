import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.pipeline import Pipeline
from typing import Dict, Any, List

def train_clustering_model(
    df: pd.DataFrame,
    features: List[str],
    preprocessor: Any,
    random_state: int = 42
) -> Dict[str, Any]:
    X = df[features]
    n_samples = len(X)
    
    if n_samples < 3:
        raise ValueError(f"At least 3 rows are required for clustering analysis. Got {n_samples} rows.")
        
    # Fit preprocessor
    X_proc = preprocessor.fit_transform(X)
    
    # Test valid cluster options: 2 <= k < number_of_samples (cap at 6)
    max_k = min(6, n_samples - 1)
    k_candidates = list(range(2, max_k + 1))
    
    if not k_candidates:
        raise ValueError(f"Insufficient samples to perform cluster separations. Got {n_samples} samples.")
        
    silhouette_scores = {}
    best_k = None
    best_score = -2.0
    
    for k in k_candidates:
        try:
            kmeans = KMeans(n_clusters=k, random_state=random_state, n_init="auto")
            labels = kmeans.fit_predict(X_proc)
            score = float(silhouette_score(X_proc, labels))
            silhouette_scores[k] = round(score, 3)
            
            if score > best_score:
                best_score = score
                best_k = k
        except Exception as e:
            silhouette_scores[k] = 0.0
            
    if best_k is None:
        best_k = 2
        best_score = 0.0
        
    # Fit final clustering model using the recommended best_k
    final_kmeans = KMeans(n_clusters=best_k, random_state=random_state, n_init="auto")
    final_kmeans.fit(X_proc)
    
    final_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('clustering', final_kmeans)
    ])
    
    # Calculate cluster sizing splits
    final_labels = final_kmeans.labels_
    cluster_counts = pd.Series(final_labels).value_counts().to_dict()
    cluster_sizes = {f"Cluster {c}": int(cnt) for c, cnt in cluster_counts.items()}
    
    return {
        "task_type": "clustering",
        "best_k": best_k,
        "recommendation_reason": f"Selected k = {best_k} clusters because it returned the highest Silhouette coefficient score ({best_score:.2f}) among tested options.",
        "silhouette_scores": silhouette_scores,
        "cluster_sizes": cluster_sizes,
        "pipeline": final_pipeline,
        "training_rows": n_samples
    }
