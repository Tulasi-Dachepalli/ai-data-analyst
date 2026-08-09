import os
import re
import httpx
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple

from insights.anomaly_detector import detect_anomalies
from insights.relationship_engine import interpret_relationships
from insights.business_metrics import calculate_business_kpis
from insights.recommendation_engine import generate_recommendations

def call_llm(system: str, user_text: str) -> str:
    gemini_key = os.environ.get("GEMINI_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "systemInstruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": user_text}]}],
                "generationConfig": {"maxOutputTokens": 1000}
            }
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    txt = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if txt:
                        return txt.strip()
        except Exception as e:
            print(f"Gemini API call failed: {e}")
            
    if anthropic_key:
        try:
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": anthropic_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1000,
                "system": system,
                "messages": [{"role": "user", "content": user_text}]
            }
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    txt = data.get("content", [{}])[0].get("text", "")
                    if txt:
                        return txt.strip()
        except Exception as e:
            print(f"Anthropic API call failed: {e}")
            
    return ""

def classify_query_intent(question: str) -> str:
    q_lower = question.lower()
    
    if any(k in q_lower for k in ["forecast", "projection", "predict next", "arima", "sarima"]):
        return "FORECASTING"
    if any(k in q_lower for k in ["anomal", "outlier", "unusual", "spike", "drop"]):
        return "ANOMALY_INVESTIGATION"
    if any(k in q_lower for k in ["train", "machine learning", "classifier", "regression model", "automl", "model build"]):
        return "ML"
    if any(k in q_lower for k in ["clean", "fill missing", "impute", "remove constant"]):
        return "CLEANING_RECOMMENDATION"
    if any(k in q_lower for k in ["correlation", "relationship", "association", "correlated"]):
        return "STATISTICS"
    if any(k in q_lower for k in ["eda", "chart", "plot", "pie", "histogram", "scatterplot"]):
        return "EDA"
    if any(k in q_lower for k in ["top", "bottom", "highest", "lowest", "best", "worst"]):
        return "DESCRIPTIVE"
    if any(k in q_lower for k in ["average", "mean", "sum", "total", "max", "min", "count", "avg"]):
        return "AGGREGATION"
        
    return "GENERAL"

def extract_columns(question: str, columns: List[str]) -> List[str]:
    found = []
    q_lower = question.lower()
    # Match longer names first to avoid matching substrings
    sorted_cols = sorted(columns, key=len, reverse=True)
    for col in sorted_cols:
        col_lower = col.lower()
        # Handle camelCase / PascalCase split to space separated lower words, e.g. "SalesAmount" -> "sales amount"
        spaced_col = re.sub(r'(?<!^)(?=[A-Z])', ' ', col).lower()
        variations = [col_lower, col_lower.replace("_", " "), col_lower.replace(" ", ""), spaced_col]
        if any(var in q_lower for var in variations):
            if col not in found:
                found.append(col)
    return found

def run_chat_nlp_engine(
    question: str,
    history: List[Dict[str, str]],
    rows: List[Dict[str, Any]],
    columns: List[str],
    profile: Dict[str, Any],
    statistics: Dict[str, Any]
) -> Dict[str, Any]:
    # 1. Enforce strict 10,000-row cap defensively
    df = pd.DataFrame(rows[:10000])
    
    intent = classify_query_intent(question)
    relevant_cols = extract_columns(question, columns)
    supporting_values = []
    confidence = 1.0
    
    # 2. Deterministic execution planner based on intent classification
    if intent == "ANOMALY_INVESTIGATION":
        anomalies = detect_anomalies(df, profile)
        if relevant_cols:
            supporting_values = [a for a in anomalies if a["column"] in relevant_cols]
        else:
            supporting_values = anomalies[:10]
        confidence = 0.95
        
    elif intent == "STATISTICS":
        rels = interpret_relationships(statistics, len(df))
        if relevant_cols:
            supporting_values = [r for r in rels if r["column_a"] in relevant_cols or r["column_b"] in relevant_cols]
        else:
            supporting_values = rels[:8]
        confidence = 0.90
        
    elif intent == "FORECASTING":
        recs, target_recs = generate_recommendations(profile, columns)
        supporting_values = [
            {"recommendation": "FORECASTING", "options": target_recs, "message": "Time-series forecasting module available."}
        ]
        confidence = 0.85
        
    elif intent == "ML":
        recs, target_recs = generate_recommendations(profile, columns)
        supporting_values = [
            {"recommendation": "ML_MODELING", "candidates": target_recs, "message": "AutoML training models can be configured."}
        ]
        confidence = 0.85
        
    elif intent == "CLEANING_RECOMMENDATION":
        recs, target_recs = generate_recommendations(profile, columns)
        cleaning_recs = [r for r in recs if r["recommendation"] == "DATA_CLEANING"]
        supporting_values = cleaning_recs if cleaning_recs else recs[:1]
        confidence = 0.95
        
    elif intent in ["AGGREGATION", "DESCRIPTIVE"]:
        if not relevant_cols:
            # Fall back to general profile KPI
            kpis = calculate_business_kpis(df, columns)
            supporting_values = kpis[:3]
        else:
            # Separate numeric and categorical
            num_cols = [c for c in relevant_cols if pd.api.types.is_numeric_dtype(df[c])]
            cat_cols = [c for c in relevant_cols if c not in num_cols]
            
            # Extract Aggregation mode
            q_lower = question.lower()
            agg_op = "sum"
            if "avg" in q_lower or "average" in q_lower or "mean" in q_lower:
                agg_op = "mean"
            elif "max" in q_lower or "highest" in q_lower or "greatest" in q_lower:
                agg_op = "max"
            elif "min" in q_lower or "lowest" in q_lower or "least" in q_lower:
                agg_op = "min"
            elif "count" in q_lower or "number of" in q_lower:
                agg_op = "count"
                
            # Extract Limit (top-n)
            limit = 10
            limit_match = re.search(r'\b(top|bottom|highest|lowest)\s+(\d+)\b', q_lower)
            if limit_match:
                limit = int(limit_match.group(2))
                
            try:
                if cat_cols and num_cols:
                    # Group by first cat col, aggregate first numeric col
                    res_df = df.groupby(cat_cols[0])[num_cols[0]].agg(agg_op).reset_index()
                    res_df = res_df.sort_values(by=num_cols[0], ascending=("lowest" in q_lower or "bottom" in q_lower))
                    res_df = res_df.head(limit)
                    supporting_values = res_df.to_dict(orient="records")
                elif num_cols:
                    # Direct aggregate
                    val = df[num_cols[0]].agg(agg_op)
                    supporting_values = [{"column": num_cols[0], "operation": agg_op, "value": float(val) if not pd.isna(val) else 0.0}]
                elif cat_cols:
                    # Frequency count
                    res_df = df[cat_cols[0]].value_counts().reset_index()
                    res_df.columns = [cat_cols[0], "count"]
                    res_df = res_df.sort_values(by="count", ascending=("lowest" in q_lower or "bottom" in q_lower))
                    res_df = res_df.head(limit)
                    supporting_values = res_df.to_dict(orient="records")
            except Exception as ex:
                supporting_values = [{"error": f"Failed aggregation: {str(ex)}"}]
                confidence = 0.5
                
    else:  # GENERAL
        kpis = calculate_business_kpis(df, columns)
        supporting_values = kpis[:2]
        confidence = 0.80

    # Ensure all numerical values are converted to standard float/int for JSON serialization
    clean_supporting = []
    for row in supporting_values:
        clean_row = {}
        for k, v in row.items():
            if isinstance(v, (np.integer, np.int64)):
                clean_row[k] = int(v)
            elif isinstance(v, (np.floating, np.float64)):
                clean_row[k] = float(v) if not np.isnan(v) else 0.0
            elif isinstance(v, list):
                clean_row[k] = [str(item) for item in v]
            else:
                clean_row[k] = v
        clean_supporting.append(clean_row)

    # 3. Grounded Answer Prompt formatting
    disclaimer = (
        "This response is grounded strictly in statistical associations. "
        "Correlation does not imply causation, and identified relationships should not be interpreted "
        "as definitive evidence of cause-and-effect."
    )
    
    system_prompt = (
        "You are an expert data analyst assistant. Your task is to explain verified statistics to the user.\n"
        "RULES:\n"
        "1. Ground every single numeric value in the 'Verified Data' context provided below. Never invent numbers.\n"
        "2. If the 'Verified Data' context is empty or insufficient, state that you do not have enough information to answer.\n"
        "3. Focus on a formal corporate summary. Keep descriptions concise and clear.\n"
        "4. Distinguish correlation and association from causation explicitly. Causation should always be rejected unless verified experimentally."
    )
    
    user_prompt = (
        f"User Question: {question}\n\n"
        f"Verified Data Facts:\n{clean_supporting}\n\n"
        f"Dataset Columns: {columns}\n\n"
        f"Disclaimer Rule: {disclaimer}"
    )
    
    answer_text = call_llm(system_prompt, user_prompt)
    if not answer_text:
        # Robust template fallback text
        if intent == "ANOMALY_INVESTIGATION":
            answer_text = f"A data quality scan flagged {len(clean_supporting)} anomalous observations in the target columns. Values are detailed in the log below."
        elif intent == "STATISTICS":
            answer_text = f"Statistical association analysis completed. Strength metrics are mapped in the relationships table below."
        elif intent in ["AGGREGATION", "DESCRIPTIVE"]:
            ops_str = ", ".join([f"{r.get('column', 'Metric')} = {r.get('value', r.get('count', 'N/A'))}" for r in clean_supporting])
            answer_text = f"Deterministic aggregation completed successfully. Calculated results: {ops_str}."
        else:
            answer_text = "The requested metrics were retrieved deterministically from the dataset context."

    return {
        "success": True,
        "answer": answer_text,
        "intent": intent,
        "supporting_values": clean_supporting,
        "relevant_columns": relevant_cols,
        "confidence_score": confidence,
        "association_disclaimer": disclaimer,
        "dataset_context": {
            "rows_evaluated": len(df),
            "total_columns": len(columns),
            "quality_score": float(profile.get("quality_score", 100.0))
        }
    }
