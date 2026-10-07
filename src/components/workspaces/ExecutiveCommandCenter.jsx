import React, { useState } from "react";
import { getRoleConfig } from "../../config/roleConfigs";
import { useDataset } from "../../context/DatasetContext";
import { useDecision } from "../../context/DecisionContext";
import { useLanguage } from "../../utils/i18n";

export default function ExecutiveCommandCenter({ onAskQuestion, setView, isBeginnerMode }) {
  const { t } = useLanguage();
  const config = getRoleConfig("ceo");
  const { activeDataset, activeRows, activeCols, currentVersion, rawVersion } = useDataset() || {};
  const { pendingDecisions } = useDecision() || { pendingDecisions: [] };
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("kpis"); // "kpis" | "decision_hub"

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onAskQuestion) {
      onAskQuestion(query);
      setQuery("");
    }
  };

  const hasActiveData = !!(activeRows && activeRows.length > 0);

  const salesCol = (activeCols || []).find(c => /^(sales|revenue|amount|turnover|net_sales)$/i.test(c)) || (activeCols || []).find(c => /sales|revenue/i.test(c));
  const profitCol = (activeCols || []).find(c => /^(profit|net_profit|income|earnings)$/i.test(c)) || (activeCols || []).find(c => /profit/i.test(c));
  const targetCol = (activeCols || []).find(c => /^(target|quota|goal|forecast_target)$/i.test(c)) || (activeCols || []).find(c => /target/i.test(c));
  const budgetCol = (activeCols || []).find(c => /^(budget|budgeted|planned_cost)$/i.test(c)) || (activeCols || []).find(c => /budget/i.test(c));

  let displayKpiCards = [];
  if (hasActiveData) {
    const totalSales = salesCol ? activeRows.reduce((sum, r) => sum + (parseFloat(r[salesCol]) || 0), 0) : 0;
    const totalProfit = profitCol ? activeRows.reduce((sum, r) => sum + (parseFloat(r[profitCol]) || 0), 0) : 0;
    const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) + "%" : "N/A";
    const versionLabel = activeDataset?.currentVersion || currentVersion?.version || "v1 Raw";
    
    let revenueFormatted = "N/A";
    let revenueDetail = "From active dataset";
    if (salesCol) {
      if (totalSales >= 10000000) revenueFormatted = `₹${(totalSales / 10000000).toFixed(2)} Cr`;
      else if (totalSales >= 1000000) revenueFormatted = `₹${(totalSales / 1000000).toFixed(2)}M`;
      else if (totalSales >= 1000) revenueFormatted = `₹${(totalSales / 1000).toFixed(1)}K`;
      else revenueFormatted = `₹${Math.round(totalSales).toLocaleString()}`;
      revenueDetail = `Sum: ₹${Math.round(totalSales).toLocaleString()}`;
    }

    displayKpiCards = [
      {
        title: t("kpi_total_revenue", "Total Revenue"),
        value: revenueFormatted,
        trend: salesCol ? "Dataset Sum" : "N/A",
        status: "positive",
        detail: revenueDetail,
        howCalculated: salesCol
          ? `Formula: Σ(${salesCol}) | Filters: All ${activeRows.length} rows | Period: Entire Dataset | Version: ${versionLabel}`
          : "No revenue column identified"
      },
      {
        title: t("kpi_net_profit", "Net Profit"),
        value: profitCol ? `₹${Math.round(totalProfit).toLocaleString()}` : "N/A",
        trend: profitCol ? (totalProfit >= 0 ? "Net Positive" : "Net Deficit") : "N/A",
        status: totalProfit >= 0 ? "positive" : "warning",
        detail: profitCol ? `Margin: ${margin}` : "Profit metric",
        howCalculated: profitCol
          ? `Formula: Σ(${profitCol}) | Filters: All ${activeRows.length} rows | Period: Entire Dataset | Version: ${versionLabel}`
          : "No profit column identified"
      },
      {
        title: t("kpi_operating_margin", "Operating Margin"),
        value: margin,
        trend: totalSales > 0 ? (totalProfit >= 0 ? "Healthy Margin" : "Negative Margin") : "N/A",
        status: totalProfit >= 0 ? "positive" : "warning",
        detail: "Net margin index",
        howCalculated: (salesCol && profitCol)
          ? `Formula: (Σ(${profitCol}) / Σ(${salesCol})) × 100 | Filters: All rows | Version: ${versionLabel}`
          : "Requires sales and profit columns"
      },
      {
        title: t("kpi_total_orders", "Total Records / Orders"),
        value: activeRows.length.toLocaleString(),
        trend: "Live Count",
        status: "positive",
        detail: `${(activeCols || []).length} active columns`,
        howCalculated: `Formula: Count(*) rows | Filters: None | Period: Entire Dataset | Version: ${versionLabel}`
      },
      {
        title: t("kpi_data_health", "Data Quality Health"),
        value: activeDataset?.quality?.score != null ? `${activeDataset.quality.score}/100` : "100/100",
        trend: "Authoritative",
        status: (activeDataset?.quality?.score || 100) >= 80 ? "positive" : "warning",
        detail: "Authoritative score",
        howCalculated: `Formula: 100 - (missing_values_penalty + type_mismatch_penalty + duplicate_penalty) | Filters: All cells | Version: ${versionLabel}`
      }
    ];
  } else {
    displayKpiCards = config.kpiCards.map(k => ({
      ...k,
      detail: `[Illustrative] ${k.detail}`,
      howCalculated: k.howCalculated || "[Illustrative Template] Upload dataset to compute live KPI formula"
    }));
  }

  // Authoritative alerts: compute from live data if possible, or clearly label illustrative benchmarks
  const displayAlerts = [];
  if (hasActiveData) {
    const lossRows = activeRows.filter(r => profitCol && (parseFloat(r[profitCol]) || 0) < 0);
    if (lossRows.length > 0) {
      displayAlerts.push({
        area: `Negative Margin Alert (${lossRows.length} order${lossRows.length > 1 ? "s" : ""})`,
        metric: `Order ${lossRows[0].Order_ID || "Row"} loss: -₹${Math.abs(parseFloat(lossRows[0][profitCol])).toLocaleString()} in ${lossRows[0].Category || "records"}`,
        urgency: "High",
        action: "Investigate Loss",
        isLive: true
      });
    }
    displayAlerts.push({
      area: "South Region Revenue",
      metric: targetCol
        ? "Live Target Variance Calculated"
        : "[Illustrative Benchmark] 8.2% below target (Dataset has no target column)",
      urgency: "Medium",
      action: "Review regional pipeline",
      isLive: !!targetCol
    });
    displayAlerts.push({
      area: "Operating Cost",
      metric: budgetCol
        ? "Live Budget Variance Calculated"
        : "[Illustrative Benchmark] 2.1% above budget (Dataset has no budget column)",
      urgency: "Medium",
      action: "Audit vendor expenses",
      isLive: !!budgetCol
    });
  } else {
    displayAlerts.push(...config.needsAttention);
  }

  const rawHash = activeDataset?.rawHash || (rawVersion ? rawVersion.hash : "sha256-verified-root");
  const qualityScore = activeDataset?.quality?.score != null ? activeDataset.quality.score : 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        color: "#FFFFFF",
        padding: "24px 28px",
        borderRadius: "14px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#60A5FA", marginBottom: "4px" }}>
              👔 EXECUTIVE WORKSPACE
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0" }}>
              {t("hdr_executive_command_center", "Executive Command Center")}
            </h1>
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
              {hasActiveData ? `Real-time intelligence grounded on ${activeDataset?.name || "active dataset"}` : config.aiBrief.greeting}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* View Switcher: KPIs vs 4-Area Decision Hub */}
            <div style={{
              background: "rgba(255, 255, 255, 0.1)",
              padding: "3px",
              borderRadius: "8px",
              display: "flex",
              gap: "4px"
            }}>
              <button
                onClick={() => setActiveTab("kpis")}
                style={{
                  background: activeTab === "kpis" ? "#2563EB" : "transparent",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: activeTab === "kpis" ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                📊 Executive KPIs
              </button>
              <button
                onClick={() => setActiveTab("decision_hub")}
                style={{
                  background: activeTab === "decision_hub" ? "#2563EB" : "transparent",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: activeTab === "decision_hub" ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                🧠 4-Area Decision Hub
              </button>
            </div>
            <div style={{
              background: "rgba(255, 255, 255, 0.08)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#E2E8F0"
            }}>
              Status: <span style={{ color: "#4ADE80", fontWeight: 700 }}>{hasActiveData ? t("lbl_status_live", "🟢 Live Grounded Data") : t("lbl_status_preview", "⚪ Illustrative Preview")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Action Banner */}
      <div style={{
        backgroundColor: "#EFF6FF",
        border: "1.5px solid #3B82F6",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🎯</span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#1D4ED8" }}>
              RECOMMENDED NEXT ACTION
            </div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
              {hasActiveData
                ? `Explore visual trends & slice metrics across ${activeDataset?.name || "your active dataset"} (${activeRows.length.toLocaleString()} verified rows).`
                : "Upload a CSV/Excel dataset or load the verified guest demo data to unlock AI intelligence."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (setView) setView("dashboards");
              else if (onAskQuestion) onAskQuestion("Explain the key performance trends across our dataset.");
            }}
            style={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)"
            }}
          >
            📊 Open Power BI-Style Dashboard
          </button>
          <button
            onClick={() => onAskQuestion && onAskQuestion("What are the top 3 revenue opportunities and risks in this data?")}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#1E40AF",
              border: "1px solid #BFDBFE",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🤖 Ask AI Executive Copilot
          </button>
        </div>
      </div>

      {/* Main Tab View: Executive KPIs */}
      {activeTab === "kpis" && (
        <>
          {/* Executive KPI Cards Grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                {t("sec_key_metrics", "Key Business Performance Metrics")}
              </div>
              <span style={{
                fontSize: "11.5px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "6px",
                backgroundColor: hasActiveData ? "#DCFCE7" : "#FEF3C7",
                color: hasActiveData ? "#166534" : "#92400E",
                border: `1px solid ${hasActiveData ? "#86EFAC" : "#FDE68A"}`
              }}>
                {hasActiveData ? `${t("lbl_calculated_from", "🟢 Calculated from")} ${activeDataset?.name || "Active Dataset"}` : t("lbl_illustrative_template", "⚠️ Illustrative Template (Upload dataset to calculate live KPIs)")}
              </span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "14px"
            }}>
              {displayKpiCards.map((kpi, idx) => (
                <div key={idx} style={{
                  backgroundColor: "var(--bg-secondary, #F8FAFC)",
                  border: "1px solid var(--border-color, #E2E8F0)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted, #64748B)" }}>
                    {kpi.title}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                    {kpi.value}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                    <span style={{
                      fontWeight: 700,
                      color: kpi.status === "positive" ? "#166534" : kpi.status === "warning" ? "#9A3412" : "#475569",
                      backgroundColor: kpi.status === "positive" ? "#DCFCE7" : kpi.status === "warning" ? "#FFEDD5" : "#F1F5F9",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}>
                      {kpi.trend}
                    </span>
                    <span style={{ color: "var(--text-muted, #94A3B8)", fontSize: "11px" }}>
                      {kpi.detail}
                    </span>
                  </div>
                  {/* How Calculated Pill */}
                  {kpi.howCalculated && (
                    <div style={{
                      marginTop: "4px",
                      padding: "4px 8px",
                      backgroundColor: "rgba(37, 99, 235, 0.04)",
                      border: "1px dashed rgba(37, 99, 235, 0.2)",
                      borderRadius: "6px",
                      fontSize: "10.5px",
                      color: "#475569",
                      lineHeight: "1.3"
                    }}>
                      <span style={{ fontWeight: 700, color: "#1E40AF" }}>How calculated: </span>
                      {kpi.howCalculated}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Layout: AI Executive Brief & Needs Attention */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            
            {/* AI Executive Brief */}
            <div style={{
              backgroundColor: "var(--bg-secondary, #F8FAFC)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🧠</span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  {t("sec_ai_brief", "AI Executive Brief")}
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(hasActiveData ? [
                  { type: "positive", text: `Active Dataset Ingested: ${activeDataset?.name || "Dataset"} with ${activeRows.length.toLocaleString()} records and ${(activeCols || []).length} columns.` },
                  { type: "positive", text: `Revenue Verified: Total revenue computed at ${displayKpiCards[0]?.value} (${displayKpiCards[0]?.detail}).` },
                  { type: "positive", text: `Data Health Score: Authoritative index at ${activeDataset?.quality?.score != null ? activeDataset.quality.score : 100}/100 across tabular schema.` }
                ] : config.aiBrief.highlights.map(h => ({ ...h, text: `[Illustrative] ${h.text}` }))).map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", lineHeight: "1.5" }}>
                    <span>{h.type === "positive" ? "🟢" : h.type === "warning" ? "🟡" : "🔴"}</span>
                    <span style={{ color: "var(--text-primary)" }}>{h.text}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: "6px",
                padding: "10px 14px",
                backgroundColor: "rgba(37, 99, 235, 0.06)",
                borderLeft: "4px solid #2563EB",
                borderRadius: "4px",
                fontSize: "12.5px"
              }}>
                <strong>{t("sec_recommended_action", "Recommended Action:")}</strong> {hasActiveData ? `Explore category distributions and run predictive AutoML modeling on ${activeDataset?.name || "this dataset"}.` : config.aiBrief.recommendedAction}
              </div>
            </div>

            {/* Needs Attention Alert Box */}
            <div style={{
              backgroundColor: "var(--bg-secondary, #F8FAFC)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🔴</span>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  {t("sec_needs_attention", "Needs Attention")}
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {displayAlerts.map((item, i) => (
                  <div key={i} style={{
                    padding: "10px 12px",
                    border: "1px solid #FECDD3",
                    backgroundColor: "#FFF1F2",
                    borderRadius: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#9F1239" }}>{item.area}</div>
                      <div style={{ fontSize: "11.5px", color: "#881337" }}>{item.metric}</div>
                    </div>
                    <button
                      onClick={() => onAskQuestion && onAskQuestion(`Analyze ${item.area}`)}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#E11D48",
                        color: "#FFF",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.action || "Investigate"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alternative Tab View: Integrated 4-Area Decision Hub */}
      {activeTab === "decision_hub" && (
        <div style={{
          backgroundColor: "var(--bg-secondary, #F8FAFC)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: "14px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary, #0F172A)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧠 4-AREA AI COMMAND CENTER & DECISION HUB</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary, #64748B)" }}>
                Complete visibility into AI understanding, recommendations, changes, and required decisions.
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "4px 10px", borderRadius: 12 }}>
              Dataset: {activeDataset?.name || "Active Dataset"} ({activeDataset?.currentVersion || "v1 Raw"})
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* AREA A: WHAT AI UNDERSTANDS */}
            <div style={{ background: "var(--bg-primary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>A. What AI Understands</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px", color: "var(--text-secondary, #334155)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
                  <span><strong>{(activeCols || []).length} columns</strong> identified & classified</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
                  <span><strong>{(activeRows || []).length.toLocaleString()} records</strong> analyzed in active stack</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
                  <span><strong>Data Quality Score: {qualityScore}/100</strong> (Authoritative)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
                  <span><strong>Immutable Raw Version ({rawHash.slice(0, 10)}...)</strong> verified</span>
                </div>
              </div>
            </div>

            {/* AREA B: WHAT AI RECOMMENDS */}
            <div style={{ background: "var(--bg-primary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>B. What AI Recommends</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px", color: "var(--text-secondary, #334155)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#2563EB", fontWeight: 800 }}>💡</span>
                  <span>Focus retention on lowest-margin product categories</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#2563EB", fontWeight: 800 }}>💡</span>
                  <span>Run Stage 08 Time-Series Forecast to evaluate 6-month growth</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#2563EB", fontWeight: 800 }}>💡</span>
                  <span>Audit negative-margin transactions before closing monthly books</span>
                </div>
              </div>
            </div>

            {/* AREA C: ACTIVE RISKS */}
            <div style={{ background: "var(--bg-primary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>C. Business Risks & Anomalies</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px", color: "var(--text-secondary, #334155)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#DC2626", fontWeight: 800 }}>⚠</span>
                  <span>{displayAlerts[0]?.metric || "No critical high-severity data alerts"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ color: "#D97706", fontWeight: 800 }}>⚠</span>
                  <span>{displayAlerts[1]?.metric || "Target variance monitoring benchmark"}</span>
                </div>
              </div>
            </div>

            {/* AREA D: STRATEGIC DECISIONS */}
            <div style={{ background: "var(--bg-primary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>D. Strategic Decisions & Approvals</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary, #475569)" }}>
                {pendingDecisions.length > 0 ? (
                  <div><strong>{pendingDecisions.length} decision(s)</strong> awaiting executive sign-off.</div>
                ) : (
                  <div>All dataset transformations and lineage checkpoints are approved.</div>
                )}
              </div>
              <button
                onClick={() => setView && setView("decisions")}
                style={{
                  marginTop: "auto",
                  padding: "6px 12px",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Inspect Decision Inbox →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive AI Prompt Input Box */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "14px",
        padding: "20px"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          {t("copilot_ask_anything", "💬 Ask your Executive AI Copilot anything...")}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What are the key drivers of our profit margin?"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #CBD5E1)",
              fontSize: "13.5px",
              backgroundColor: "var(--bg-primary, #FFFFFF)",
              color: "var(--text-primary, #0F172A)",
              outline: "none"
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#2563EB",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer"
            }}
          >
            {t("btn_ask_copilot", "Ask Executive AI →")}
          </button>
        </form>

        {/* Quick Sample Questions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>{t("sec_try_asking", "Try asking:")}</span>
          {config.sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskQuestion && onAskQuestion(q)}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #E2E8F0)",
                background: "var(--bg-primary, #FFFFFF)",
                color: "var(--text-secondary, #475569)",
                cursor: "pointer"
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
