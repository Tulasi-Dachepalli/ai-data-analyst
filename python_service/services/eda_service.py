import pandas as pd
import numpy as np
from typing import Dict, Any, List

def generate_eda_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    charts = []
    
    # Clean headers
    df.columns = [str(c).strip() for c in df.columns]
    
    # 1. Classify columns
    numeric_cols = []
    categorical_cols = []
    date_cols = []
    
    for col in df.columns:
        series = df[col]
        # Check if Date column
        col_lower = col.lower()
        is_date_name = any(d in col_lower for d in ["date", "year", "month", "time"])
        
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            # If a column name implies date (e.g. Year) and values are integers, it could be a date
            if is_date_name:
                date_cols.append(col)
            else:
                numeric_cols.append(col)
        elif is_date_name:
            date_cols.append(col)
        else:
            unique_count = series.nunique()
            if 1 < unique_count <= 25:
                categorical_cols.append(col)
                
    # Fallback to categorical if columns count is low
    if not categorical_cols:
        for col in df.columns:
            if not pd.api.types.is_numeric_dtype(df[col]) and df[col].nunique() <= 50:
                categorical_cols.append(col)
                
    # 2. Recommendation Generator
    # Target numerical values for aggregate comparisons
    primary_num = numeric_cols[0] if numeric_cols else None
    
    # --- CHART 1: Numerical Distribution (Histogram) ---
    for num_col in numeric_cols[:2]:
        valid_data = df[num_col].dropna()
        if not valid_data.empty:
            counts, bins = np.histogram(valid_data, bins=8)
            chart_data = []
            for i in range(len(counts)):
                bin_label = f"{round(float(bins[i]), 1)} - {round(float(bins[i+1]), 1)}"
                chart_data.append({
                    "bin": bin_label,
                    "count": int(counts[i])
                })
            charts.append({
                "type": "bar",
                "title": f"Distribution of {num_col}",
                "xAxis": "bin",
                "yAxis": "count",
                "data": chart_data
            })
            
    # --- CHART 2: Categorical Breakdown ---
    for cat_col in categorical_cols[:2]:
        if primary_num:
            # Aggregate primary numerical sum by category
            group = df.groupby(cat_col)[primary_num].sum().reset_index()
            group = group.sort_values(by=primary_num, ascending=False).head(10)
            group.columns = [cat_col, primary_num]
            chart_data = group.to_dict(orient="records")
            charts.append({
                "type": "bar",
                "title": f"Total {primary_num} by {cat_col}",
                "xAxis": cat_col,
                "yAxis": primary_num,
                "data": chart_data
            })
        else:
            # Fallback to pure counts frequency
            group = df[cat_col].value_counts().reset_index()
            group.columns = [cat_col, "count"]
            group = group.head(10)
            chart_data = group.to_dict(orient="records")
            charts.append({
                "type": "bar",
                "title": f"Count by {cat_col}",
                "xAxis": cat_col,
                "yAxis": "count",
                "data": chart_data
            })

    # --- CHART 3: Trend Over Time (Line Chart) ---
    for date_col in date_cols[:1]:
        # Parse dates safely
        parsed_dates = pd.to_datetime(df[date_col], errors='coerce')
        if parsed_dates.notnull().any():
            temp_df = df.copy()
            temp_df["parsed_date"] = parsed_dates
            temp_df = temp_df.dropna(subset=["parsed_date"])
            
            # Sort chronologically
            temp_df = temp_df.sort_values(by="parsed_date")
            
            # If there are many unique dates, resample to Month periods to prevent dense lines
            if temp_df["parsed_date"].nunique() > 20:
                temp_df["period"] = temp_df["parsed_date"].dt.to_period("M").astype(str)
                time_col = "period"
            else:
                temp_df["period"] = temp_df["parsed_date"].dt.strftime("%Y-%m-%d")
                time_col = "period"
                
            if primary_num:
                trend = temp_df.groupby("period")[primary_num].sum().reset_index()
                trend.columns = [time_col, primary_num]
                chart_data = trend.to_dict(orient="records")
                charts.append({
                    "type": "line",
                    "title": f"{primary_num} Trend Over Time",
                    "xAxis": time_col,
                    "yAxis": primary_num,
                    "data": chart_data
                })
            else:
                trend = temp_df["period"].value_counts().reset_index()
                trend.columns = [time_col, "count"]
                trend = trend.sort_values(by=time_col)
                chart_data = trend.to_dict(orient="records")
                charts.append({
                    "type": "line",
                    "title": "Frequencies Over Time",
                    "xAxis": time_col,
                    "yAxis": "count",
                    "data": chart_data
                })

    # --- CHART 4: Correlation / Relationship (Scatter Plot) ---
    if len(numeric_cols) >= 2:
        num1, num2 = numeric_cols[0], numeric_cols[1]
        subset = df[[num1, num2]].dropna()
        # Cap scatter plot data at 100 sample points to keep DOM performance stable
        sample = subset.sample(n=min(len(subset), 100), random_state=42)
        chart_data = []
        for _, r in sample.iterrows():
            chart_data.append({
                num1: float(r[num1]),
                num2: float(r[num2])
            })
        charts.append({
            "type": "scatter",
            "title": f"{num1} vs {num2} Relationship",
            "xAxis": num1,
            "yAxis": num2,
            "data": chart_data
        })
        
    return charts
