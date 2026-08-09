from typing import List, Dict, Any

def interpret_relationships(statistics: Dict[str, Any], sample_size: int) -> List[Dict[str, Any]]:
    interpreted = []
    
    correlation_data = statistics.get("correlation", {})
    relationships = correlation_data.get("relationships", [])
    
    for rel in relationships:
        col_a = rel.get("column")
        # Since Python alias Field maps "with" to "with_col", we handle both
        col_b = rel.get("with") or rel.get("with_col")
        val = rel.get("value")
        
        if col_a is None or col_b is None or val is None:
            continue
            
        r_abs = abs(val)
        
        # Strength threshold mappings
        if r_abs >= 0.90:
            strength = "Very Strong"
        elif r_abs >= 0.70:
            strength = "Strong"
        elif r_abs >= 0.40:
            strength = "Moderate"
        elif r_abs >= 0.20:
            strength = "Weak"
        else:
            strength = "Very Weak"
            
        # Direction
        if val > 0.05:
            direction = "Positive"
        elif val < -0.05:
            direction = "Negative"
        else:
            direction = "Neutral"
            
        # Adjust strength interpretation if sample size is extremely small
        if sample_size < 30:
            strength_desc = f"{strength.lower()} (low confidence due to small sample size of {sample_size})"
        else:
            strength_desc = strength.lower()
            
        direction_desc = direction.lower()
        if direction == "Neutral":
            interpretation = f"{col_a} shows no significant linear correlation with {col_b}."
        else:
            interpretation = f"{col_a} has a {strength_desc} {direction_desc} association with {col_b}."
            
        interpreted.append({
            "column_a": col_a,
            "column_b": col_b,
            "correlation": round(float(val), 3),
            "strength": strength,
            "direction": direction,
            "interpretation": interpretation,
            "causation_claim": False,
            "sample_size": sample_size
        })
        
    return interpreted
