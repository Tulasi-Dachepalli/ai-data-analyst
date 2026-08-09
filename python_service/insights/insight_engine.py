import pandas as pd
from datetime import datetime
from typing import List, Dict, Any

from insights.anomaly_detector import detect_anomalies
from insights.relationship_engine import interpret_relationships
from insights.business_metrics import calculate_business_kpis
from insights.recommendation_engine import generate_recommendations
from insights.narrative_generator import generate_insights_narrative

def run_insights_engine(
    rows: List[Dict[str, Any]],
    columns: List[str],
    profile: Dict[str, Any],
    statistics: Dict[str, Any]
) -> Dict[str, Any]:
    # Defensive programming: Enforce a strict 10,000-row processing limit in Python
    sampled_rows = rows[:10000]
    df = pd.DataFrame(sampled_rows)
    
    # 1. Run detectors
    anomalies = detect_anomalies(df, profile)
    relationships = interpret_relationships(statistics, len(df))
    kpis = calculate_business_kpis(df, columns)
    
    # 2. Run recommendation rules
    recommendations, target_recs = generate_recommendations(profile, columns)
    
    # 3. Generate Executive Narrative Summary markdown
    summary_md = generate_insights_narrative(profile, kpis, relationships, anomalies, recommendations)
    
    return {
        "success": True,
        "quality_score": float(profile.get("quality_score", 100.0)),
        "anomalies": anomalies,
        "relationships": relationships,
        "kpis": kpis,
        "recommendations": recommendations,
        "target_recommendations": target_recs,
        "summary": summary_md,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
