import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

SEMANTIC_ALIASES = {
    "revenue": ["revenue", "sales", "turnover", "income", "amount", "sale_amount", "net_sales"],
    "profit": ["profit", "net_profit", "earnings", "net_income"],
    "cost": ["cost", "expenses", "expense", "spend", "cost_of_goods"],
    "quantity": ["quantity", "qty", "units", "volume"],
    "orders": ["order_id", "orders", "order_count", "transaction_id", "transactions"],
    "customers": ["customer_id", "customers", "customer_count", "user_id", "users", "client_id"],
    "price": ["price", "rate", "selling_price", "unit_price"],
    "discount": ["discount", "markdown", "rebate"]
}

def detect_semantic_columns(columns: List[str]) -> Dict[str, Tuple[str, float]]:
    """Maps columns to semantic types with confidence ratings."""
    detected = {}
    for col in columns:
        col_lower = col.lower().replace(" ", "_").replace("-", "_")
        best_type = None
        best_conf = 0.0
        
        for sem_type, aliases in SEMANTIC_ALIASES.items():
            for alias in aliases:
                # Exact match
                if col_lower == alias:
                    conf = 1.0
                # Substring/prefix match
                elif col_lower.startswith(alias + "_") or col_lower.endswith("_" + alias):
                    conf = 0.9
                elif alias in col_lower:
                    conf = 0.7
                else:
                    conf = 0.0
                    
                if conf > best_conf:
                    best_conf = conf
                    best_type = sem_type
                    
        if best_conf >= 0.6:
            detected[col] = (best_type, best_conf)
            
    return detected

def format_kpi_value(val: float, sem_type: str) -> str:
    """Formats numeric values to professional formats."""
    if sem_type in ["revenue", "profit", "cost"]:
        if val >= 1_000_000:
            return f"${val/1_000_000:.2f}M"
        elif val >= 1_000:
            return f"${val/1_000:.2f}K"
        return f"${val:.2f}"
    elif sem_type in ["quantity", "orders", "customers"]:
        if val >= 1_000_000:
            return f"{val/1_000_000:.2f}M"
        elif val >= 1_000:
            return f"{val/1_000:.2f}K"
        return f"{int(val)}"
    return f"{val:.2f}"

def calculate_business_kpis(df: pd.DataFrame, columns: List[str]) -> List[Dict[str, Any]]:
    kpis = []
    if df.empty:
        return kpis
        
    sem_map = detect_semantic_columns(columns)
    
    # Invert semantic mapping to get column names for types
    type_to_cols = {}
    for col, (sem_type, conf) in sem_map.items():
        if sem_type not in type_to_cols:
            type_to_cols[sem_type] = []
        type_to_cols[sem_type].append((col, conf))
        
    # Sort so that highest confidence matches are used first
    for sem_type in type_to_cols:
        type_to_cols[sem_type].sort(key=lambda x: x[1], reverse=True)

    def get_best_col(sem_type: str) -> str:
        cols = type_to_cols.get(sem_type, [])
        return cols[0][0] if cols else None

    revenue_col = get_best_col("revenue")
    profit_col = get_best_col("profit")
    orders_col = get_best_col("orders")
    customers_col = get_best_col("customers")
    
    total_rev = None
    if revenue_col:
        try:
            vals = df[revenue_col].dropna().astype(float)
            total_rev = float(vals.sum())
            mean_rev = float(vals.mean())
            
            kpis.append({
                "column": revenue_col,
                "semantic_type": "revenue",
                "confidence": sem_map[revenue_col][1],
                "metric_label": "Total Revenue",
                "value": total_rev,
                "formatted_value": format_kpi_value(total_rev, "revenue")
            })
            kpis.append({
                "column": revenue_col,
                "semantic_type": "revenue",
                "confidence": sem_map[revenue_col][1],
                "metric_label": "Average Order/Sale Value",
                "value": mean_rev,
                "formatted_value": format_kpi_value(mean_rev, "revenue")
            })
        except Exception:
            pass

    total_profit = None
    if profit_col:
        try:
            vals = df[profit_col].dropna().astype(float)
            total_profit = float(vals.sum())
            kpis.append({
                "column": profit_col,
                "semantic_type": "profit",
                "confidence": sem_map[profit_col][1],
                "metric_label": "Total Profit",
                "value": total_profit,
                "formatted_value": format_kpi_value(total_profit, "profit")
            })
        except Exception:
            pass

    if total_rev and total_profit and total_rev > 0:
        margin = (total_profit / total_rev) * 100
        kpis.append({
            "column": profit_col,
            "semantic_type": "profit",
            "confidence": min(sem_map[revenue_col][1], sem_map[profit_col][1]),
            "metric_label": "Profit Margin",
            "value": margin,
            "formatted_value": f"{margin:.2f}%"
        })

    if orders_col:
        try:
            unique_orders = df[orders_col].nunique()
            kpis.append({
                "column": orders_col,
                "semantic_type": "orders",
                "confidence": sem_map[orders_col][1],
                "metric_label": "Total Orders Count",
                "value": float(unique_orders),
                "formatted_value": format_kpi_value(unique_orders, "orders")
            })
            if total_rev and unique_orders > 0:
                aov = total_rev / unique_orders
                kpis.append({
                    "column": orders_col,
                    "semantic_type": "orders",
                    "confidence": min(sem_map[revenue_col][1], sem_map[orders_col][1]),
                    "metric_label": "Average Order Value (AOV)",
                    "value": aov,
                    "formatted_value": format_kpi_value(aov, "revenue")
                })
        except Exception:
            pass

    if customers_col:
        try:
            unique_custs = df[customers_col].dropna().nunique()
            kpis.append({
                "column": customers_col,
                "semantic_type": "customers",
                "confidence": sem_map[customers_col][1],
                "metric_label": "Total Customers",
                "value": float(unique_custs),
                "formatted_value": format_kpi_value(unique_custs, "customers")
            })
        except Exception:
            pass

    return kpis
