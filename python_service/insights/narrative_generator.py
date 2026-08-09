from typing import List, Dict, Any

def generate_insights_narrative(
    profile: Dict[str, Any],
    kpis: List[Dict[str, Any]],
    relationships: List[Dict[str, Any]],
    anomalies: List[Dict[str, Any]],
    recommendations: List[Dict[str, Any]]
) -> str:
    rows = profile.get("rows", 0)
    cols = profile.get("columns", 0)
    quality = profile.get("quality_score", 100.0)
    missing_pct = profile.get("missing_percentage", 0.0)
    duplicates = profile.get("duplicate_rows", 0)
    
    sections = []
    
    # 1. Executive Overview
    overview_md = (
        f"## Executive Overview\n\n"
        f"The dataset contains **{rows:,}** rows and **{cols:,}** columns. "
        f"The overall data quality score is evaluated at **{quality:.1f}%**. "
    )
    if missing_pct > 0 or duplicates > 0:
        issues = []
        if missing_pct > 0:
            issues.append(f"{missing_pct:.1f}% missing cell values")
        if duplicates > 0:
            issues.append(f"{duplicates:,} duplicate rows")
        overview_md += f"We identified minor formatting anomalies including {', and '.join(issues)}."
    else:
        overview_md += "No initial missing values or duplicate rows were detected."
    sections.append(overview_md)
    
    # 2. Business KPIs
    if kpis:
        kpis_md = "### Business Metrics & KPIs\n\n"
        kpis_md += "The system matched and calculated semantic column aggregates:\n\n"
        for kpi in kpis:
            kpis_md += f"* **{kpi['metric_label']}**: `{kpi['formatted_value']}` (mapped from column *{kpi['column']}*)\n"
        sections.append(kpis_md)
        
    # 3. Relationships
    strong_relations = [r for r in relationships if r["strength"] in ["Very Strong", "Strong", "Moderate"]]
    if strong_relations:
        rel_md = "### Core Associations & Relationships\n\n"
        rel_md += "We evaluated cross-column linear correlations:\n\n"
        for rel in strong_relations[:5]: # Top 5 correlations
            rel_md += f"* **{rel['column_a']} ↔ {rel['column_b']}**: Mapped coefficient of `{rel['correlation']:.2f}` ({rel['strength'].lower()} {rel['direction'].lower()} association).\n"
        rel_md += "\n> [!NOTE]\n"
        rel_md += "> **Disclaimer**: Correlation coefficients identify linear pattern associations. They do not constitute mathematical evidence of direct causation."
        sections.append(rel_md)

    # 4. Data Quality Warnings
    if anomalies:
        anom_md = "### Data Quality Alerts & Warnings\n\n"
        anom_md += f"A total of **{len(anomalies)}** structural deviations were identified:\n\n"
        
        # Group anomalies by type
        outliers = [a for a in anomalies if a["type"] == "outlier"]
        spikes = [a for a in anomalies if a["type"] in ["spike", "drop"]]
        
        if outliers:
            anom_md += f"* **Outliers**: Found {len(outliers)} values representing significant IQR deviations.\n"
        if spikes:
            for s in spikes[:3]: # Show top 3 spikes
                action_word = "spike" if s["type"] == "spike" else "drop"
                anom_md += f"* **Temporal {action_word.capitalize()}**: Column *{s['column']}* changed by **{s['change_percent']}%** on `{s.get('date', 'N/A')}` (previous: `{s['previous_value']}`, current: `{s['current_value']}`).\n"
        sections.append(anom_md)
        
    # 5. Next Steps Recommendations
    if recommendations:
        rec_md = "### Recommended Next Actions\n\n"
        top_rec = recommendations[0]
        rec_md += f"Our automated engine suggests **{top_rec['recommendation']}** as the highest priority action:\n\n"
        rec_md += f"> **Reason**: {top_rec['reason']}\n"
        rec_md += f"> **Action**: {top_rec['action']}\n\n"
        
        if len(recommendations) > 1:
            rec_md += "Other available workflows:\n"
            for rec in recommendations[1:]:
                rec_md += f"* **{rec['recommendation']}** ({rec['priority']} priority): {rec['reason']}\n"
        sections.append(rec_md)
        
    return "\n\n".join(sections)
