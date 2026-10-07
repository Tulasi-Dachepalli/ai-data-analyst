import React, { useState } from "react";
import { getRoleConfig } from "../../config/roleConfigs";
import { useDataset } from "../../context/DatasetContext";
import { useLanguage } from "../../utils/i18n";

export default function FinanceCommandCenter({ onAskQuestion, setView, isBeginnerMode }) {
  const { t } = useLanguage();
  const config = getRoleConfig("finance");
  const { activeDataset, activeRows, activeCols, currentVersion } = useDataset() || {};
  const [query, setQuery] = useState("");

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
  const budgetCol = (activeCols || []).find(c => /^(budget|budgeted|planned_cost)$/i.test(c)) || (activeCols || []).find(c => /budget/i.test(c));

  let displayKpiCards = [];
  let displayNetMargin = "N/A";
  if (hasActiveData) {
    const totalSales = salesCol ? activeRows.reduce((sum, r) => sum + (parseFloat(r[salesCol]) || 0), 0) : 0;
    const totalProfit = profitCol ? activeRows.reduce((sum, r) => sum + (parseFloat(r[profitCol]) || 0), 0) : 0;
    const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) + "%" : "N/A";
    displayNetMargin = margin;
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
        title: t("kpi_operating_cost", "Operating Cost"),
        value: profitCol && salesCol ? `₹${Math.round(totalSales - totalProfit).toLocaleString()}` : "N/A",
        trend: (salesCol && profitCol) ? "Derived Cost" : "N/A",
        status: "positive",
        detail: (salesCol && profitCol) ? `Derived: Sales - Profit` : "Derived expense",
        howCalculated: (salesCol && profitCol)
          ? `Formula: Σ(${salesCol}) - Σ(${profitCol}) | Filters: All rows | Version: ${versionLabel}`
          : "Requires sales and profit columns"
      },
      {
        title: t("kpi_net_profit", "Net EBITDA"),
        value: profitCol ? `₹${Math.round(totalProfit).toLocaleString()}` : "N/A",
        trend: totalProfit >= 0 ? "Net Positive" : "Net Deficit",
        status: totalProfit >= 0 ? "positive" : "warning",
        detail: `Net Margin: ${margin}`,
        howCalculated: profitCol
          ? `Formula: Σ(${profitCol}) | Filters: All ${activeRows.length} rows | Period: Entire Dataset | Version: ${versionLabel}`
          : "Requires profit column"
      },
      {
        title: t("kpi_budget_variance", "Budget Variance"),
        value: budgetCol ? "Live Computed" : "N/A (No Budget Col)",
        trend: budgetCol ? "Live Variance" : "Benchmark",
        status: budgetCol ? "positive" : "neutral",
        detail: budgetCol ? "Grounded in budget column" : "Dataset lacks budget column",
        howCalculated: budgetCol
          ? `Formula: (Actual - Budget) / Budget | Version: ${versionLabel}`
          : "Formula: (Actual - Budget) / Budget | Filters: N/A | Dataset lacks target/budget column"
      },
      {
        title: t("kpi_gross_margin", "Gross Margin"),
        value: margin,
        trend: margin !== "N/A" ? "Margin Ratio" : "N/A",
        status: totalProfit >= 0 ? "positive" : "warning",
        detail: "Gross Margin Index",
        howCalculated: (salesCol && profitCol)
          ? `Formula: (Σ(${profitCol}) / Σ(${salesCol})) × 100 | Filters: All rows | Version: ${versionLabel}`
          : "Requires sales and profit columns"
      }
    ];
  } else {
    displayKpiCards = config.kpiCards.map(k => ({
      ...k,
      detail: `[Illustrative] ${k.detail}`,
      howCalculated: k.howCalculated || "[Illustrative Template] Upload dataset to calculate live KPIs"
    }));
  }

  // Label alerts as benchmarks if no budget column exists
  const displayNeedsAttention = (hasActiveData && !budgetCol)
    ? config.needsAttention.map(item => ({
        ...item,
        metric: `[Illustrative Benchmark] ${item.metric} (Dataset has no budget column)`
      }))
    : config.needsAttention;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #78350F 0%, #451A03 100%)",
        color: "#FFFFFF",
        padding: "24px 28px",
        borderRadius: "14px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#FDE68A", marginBottom: "4px" }}>
              💰 FINANCE WORKSPACE
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0" }}>
              {t("hdr_finance_command_center", "Finance Command Center")}
            </h1>
            <p style={{ fontSize: "14px", color: "#FEF3C7", margin: 0 }}>
              {hasActiveData ? `Financial metrics calculated from ${activeDataset?.name || "active dataset"}` : config.aiBrief.greeting}
            </p>
          </div>
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#FFFBEB"
          }}>
            Net Margin: <span style={{ color: "#FBBF24", fontWeight: 700 }}>{displayNetMargin}</span>
          </div>
        </div>
      </div>

      {/* Recommended Next Action Banner */}
      <div style={{
        backgroundColor: "#FFFBEB",
        border: "1.5px solid #F59E0B",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 2px 4px rgba(245, 158, 11, 0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "24px" }}>🎯</span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#B45309" }}>
              RECOMMENDED NEXT ACTION
            </div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#78350F" }}>
              {hasActiveData
                ? `Review operating margin and derived costs across ${activeDataset?.name || "active dataset"} (${activeRows.length.toLocaleString()} rows).`
                : "Upload financial statement or transaction CSV to compute live EBITDA and cost variance."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (setView) setView("dashboards");
              else if (onAskQuestion) onAskQuestion("Analyze gross margin breakdown and expense distributions.");
            }}
            style={{
              backgroundColor: "#D97706",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(217, 119, 6, 0.25)"
            }}
          >
            📊 Open Power BI-Style Dashboard
          </button>
          <button
            onClick={() => onAskQuestion && onAskQuestion("Where are we overspending or experiencing negative margins?")}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#92400E",
              border: "1px solid #FDE68A",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🤖 Ask Finance Copilot
          </button>
        </div>
      </div>

      {/* Finance KPI Cards */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            {t("sec_financial_metrics", "Financial Performance Metrics")}
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
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted, #64748B)" }}>
                {kpi.title}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                {kpi.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{
                  fontWeight: 700,
                  color: kpi.status === "positive" ? "#166534" : kpi.status === "warning" ? "#9A3412" : "#475569",
                  backgroundColor: kpi.status === "positive" ? "#DCFCE7" : kpi.status === "warning" ? "#FFEDD5" : "#F1F5F9",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  {kpi.trend}
                </span>
                <span style={{ color: "var(--text-muted, #94A3B8)" }}>{kpi.detail}</span>
              </div>
              {/* How Calculated Pill */}
              {kpi.howCalculated && (
                <div style={{
                  marginTop: "4px",
                  padding: "4px 8px",
                  backgroundColor: "rgba(217, 119, 6, 0.05)",
                  border: "1px dashed rgba(217, 119, 6, 0.25)",
                  borderRadius: "6px",
                  fontSize: "10.5px",
                  color: "#78350F",
                  lineHeight: "1.3"
                }}>
                  <span style={{ fontWeight: 700, color: "#92400E" }}>How calculated: </span>
                  {kpi.howCalculated}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Financial Alerts & Budget Variance Box */}
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
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {t("sec_needs_attention", "Financial Alerts & Budget Variance Highlights")}
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {displayNeedsAttention.map((item, i) => (
            <div key={i} style={{
              padding: "12px 16px",
              border: "1px solid #FDE68A",
              backgroundColor: "#FFFBEB",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px"
            }}>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#92400E" }}>{item.category}</div>
                <div style={{ fontSize: "12px", color: "#B45309" }}>{item.metric}</div>
              </div>
              <button
                onClick={() => onAskQuestion && onAskQuestion(`Audit variance for ${item.category}`)}
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#D97706",
                  color: "#FFF",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {item.action || "Audit"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Finance AI Prompt Box */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "14px",
        padding: "20px"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          {t("copilot_ask_anything", "💬 Ask your Finance AI Assistant anything...")}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Where are we overspending this month?"
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
              background: "#D97706",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer"
            }}
          >
            {t("btn_ask_copilot", "Ask Finance AI →")}
          </button>
        </form>

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
