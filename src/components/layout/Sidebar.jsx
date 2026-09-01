import React from "react";

// Reusable SVG Icon paths for clean and zero-dependency rendering
const Icons = {
  Overview: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Datasets: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  AIAnalyst: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Dashboards: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  Insights: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Reports: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Team: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Admin: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.5 1z" />
    </svg>
  ),
  Security: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
};

export default function Sidebar({ user, currentView, setView, onLogout, isOpen, setIsOpen }) {
  const isAdmin = user?.role === "admin";

  const navItemStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    fontSize: "13.5px",
    fontWeight: isActive ? 600 : 500,
    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
    backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
    borderRadius: "var(--radius-sm)",
    border: "none",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    transition: "background-color 0.15s ease, color 0.15s ease",
    fontFamily: "inherit",
    boxSizing: "border-box"
  });

  const sectionHeaderStyle = {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
    padding: "16px 12px 6px 12px",
    textTransform: "uppercase"
  };

  return (
    <div style={{
      width: "240px",
      height: "100vh",
      backgroundColor: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 100,
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.2s ease-in-out",
      boxSizing: "border-box",
      fontFamily: "var(--font-sans)"
    }} className="sidebar-container">
      
      {/* Workspace Header */}
      <div style={{
        padding: "20px 16px",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
            💼 {user?.companyName || "My Workspace"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {user?.email}
          </span>
        </div>
        {user?.tier === "pro" && (
          <span style={{
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            color: "#fff",
            fontSize: "9px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            textTransform: "uppercase"
          }}>
            PRO
          </span>
        )}
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        <div style={sectionHeaderStyle}>Analytics Workspace</div>
        <button onClick={() => setView("dashboard")} style={navItemStyle(currentView === "dashboard")} title="Upload spreadsheets and view interactive BI analytics">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Workspace Threads</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>Upload & Interactive Threads</span>
          </div>
        </button>

        <button onClick={() => setView("datasets")} style={navItemStyle(currentView === "datasets")} title="View all ingested spreadsheet tables">
          <Icons.Datasets />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>My Datasets</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>Ingested Spreadsheet Files</span>
          </div>
        </button>

        <button onClick={() => setView("ai-analyst")} style={navItemStyle(currentView === "ai-analyst")} title="Conversational AI Chatbot to query your data in plain English">
          <Icons.AIAnalyst />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>AI Copilot Chat</span>
            <span style={{ fontSize: "10px", color: "#8B5CF6", fontWeight: 600 }}>💬 Conversational Q&A Bot</span>
          </div>
        </button>

        <button onClick={() => setView("dashboards")} style={navItemStyle(currentView === "dashboards")} title="Executive BI Dashboards, Pie Charts & Heatmaps">
          <Icons.Dashboards />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>BI Dashboards</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>KPIs, Charts & Heatmaps</span>
          </div>
        </button>

        <button onClick={() => setView("insights")} style={navItemStyle(currentView === "insights")} title="Automated Exploratory Data Analysis & Statistics">
          <Icons.Insights />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>EDA & Statistics</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>Exploratory Shape Profiling</span>
          </div>
        </button>

        <button onClick={() => setView("reports")} style={navItemStyle(currentView === "reports")} title="Machine Learning Predictions & Time-Series Trend Forecasting">
          <Icons.Reports />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>ML & Forecasting</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>Predictive Models & Trends</span>
          </div>
        </button>

        <div style={sectionHeaderStyle}>AI Intelligence Suite</div>
        <button onClick={() => setView("health")} style={navItemStyle(currentView === "health")} title="Automated Data Quality Scoring & Anomaly Detection">
          <Icons.Security />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Data Health Inspector</span>
            <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 600 }}>🩺 Quality Score & Outliers</span>
          </div>
        </button>

        <button onClick={() => setView("whatif")} style={navItemStyle(currentView === "whatif")} title="Interactive What-If Growth & Revenue Simulator">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>What-If Simulator</span>
            <span style={{ fontSize: "10px", color: "#8B5CF6", fontWeight: 600 }}>🔮 Projections & Scenarios</span>
          </div>
        </button>

        <button onClick={() => setView("exec-reports")} style={navItemStyle(currentView === "exec-reports")} title="1-Click Executive Summary PDF & HTML Export">
          <Icons.Reports />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Executive Reports</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 }}>📄 1-Click Executive Export</span>
          </div>
        </button>

        <button onClick={() => setView("alerts")} style={navItemStyle(currentView === "alerts")} title="Automated Slack & WhatsApp Threshold Notifications">
          <Icons.Reports />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Threshold Alerts</span>
            <span style={{ fontSize: "10px", color: "#EF4444", fontWeight: 600 }}>📢 Slack & WhatsApp Webhooks</span>
          </div>
        </button>

        <button onClick={() => setView("correlation")} style={navItemStyle(currentView === "correlation")} title="Pearson Correlation Matrix & Heatmap Grid">
          <Icons.Insights />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Correlation Matrix</span>
            <span style={{ fontSize: "10px", color: "#3B82F6", fontWeight: 600 }}>📊 Heatmap Grid & Matrix</span>
          </div>
        </button>

        <button onClick={() => setView("branding")} style={navItemStyle(currentView === "branding")} title="Corporate Logo & Custom PDF Report Header Settings">
          <Icons.Security />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Corporate Branding</span>
            <span style={{ fontSize: "10px", color: "#8B5CF6", fontWeight: 600 }}>🏢 Custom Logo & Headers</span>
          </div>
        </button>

        <button onClick={() => setView("stats")} style={navItemStyle(currentView === "stats")} title="Deep Descriptive Statistics, Percentiles & Skewness">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Statistical Profiling</span>
            <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 600 }}>📐 Percentiles & Skewness</span>
          </div>
        </button>

        <button onClick={() => setView("sql")} style={navItemStyle(currentView === "sql")} title="AI Natural Language to ANSI SQL Translation & Execution">
          <Icons.Code />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>AI SQL Generator</span>
            <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 600 }}>⚡ Text-to-SQL & Live Execution</span>
          </div>
        </button>

        <button onClick={() => setView("clustering")} style={navItemStyle(currentView === "clustering")} title="AI K-Means Unsupervised Clustering & Segmentation">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Cluster Segmentation</span>
            <span style={{ fontSize: "10px", color: "#EC4899", fontWeight: 600 }}>🤖 K-Means ML Clustering</span>
          </div>
        </button>

        <button onClick={() => setView("pivot")} style={navItemStyle(currentView === "pivot")} title="Interactive 2D Pivot Table & Cross-Tabulation">
          <Icons.Reports />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>AI Pivot Table</span>
            <span style={{ fontSize: "10px", color: "#3B82F6", fontWeight: 600 }}>🔍 Cross-Tabulation & Matrix</span>
          </div>
        </button>

        <button onClick={() => setView("cohort")} style={navItemStyle(currentView === "cohort")} title="Acquisition Cohort Retention Heatmap Grid">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Cohort Analysis</span>
            <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 600 }}>📊 Retention Heatmap</span>
          </div>
        </button>

        <button onClick={() => setView("transform")} style={navItemStyle(currentView === "transform")} title="Data Transformation & Calculated Column Studio">
          <Icons.Code />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Formula Studio</span>
            <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 600 }}>⚡ Calculated Columns & Filters</span>
          </div>
        </button>

        <button onClick={() => setView("pareto")} style={navItemStyle(currentView === "pareto")} title="Pareto 80/20 Cumulative Distribution & Dual-Axis Chart">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Pareto Analysis</span>
            <span style={{ fontSize: "10px", color: "#6366F1", fontWeight: 600 }}>📊 80/20 Rule Distribution</span>
          </div>
        </button>

        <button onClick={() => setView("anomalies")} style={navItemStyle(currentView === "anomalies")} title="AI Outlier & Anomaly Root-Cause Investigator">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Anomaly Investigator</span>
            <span style={{ fontSize: "10px", color: "#EF4444", fontWeight: 600 }}>🚨 Outliers & Root Cause AI</span>
          </div>
        </button>

        <button onClick={() => setView("search")} style={navItemStyle(currentView === "search")} title="Advanced Data Search, Multi-Column Sorting & Excel Exporter">
          <Icons.Code />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Subset Explorer</span>
            <span style={{ fontSize: "10px", color: "#10B981", fontWeight: 600 }}>🔍 Search, Sort & Excel Export</span>
          </div>
        </button>

        <button onClick={() => setView("forecast")} style={navItemStyle(currentView === "forecast")} title="AI Predictive Time-Series Forecasting & 95% Confidence Bounds">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>AI Forecast</span>
            <span style={{ fontSize: "10px", color: "#8B5CF6", fontWeight: 600 }}>🔮 Time-Series Trends</span>
          </div>
        </button>

        <button onClick={() => setView("montecarlo")} style={navItemStyle(currentView === "montecarlo")} title="Monte Carlo Risk & Financial Scenario Simulator">
          <Icons.Overview />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span>Monte Carlo Risk</span>
            <span style={{ fontSize: "10px", color: "#EC4899", fontWeight: 600 }}>🎲 1,000 Stochastic Runs</span>
          </div>
        </button>

        <div style={sectionHeaderStyle}>Manage</div>
        <button onClick={() => setView("team")} style={navItemStyle(currentView === "team")}>
          <Icons.Team /> Team
        </button>

        {isAdmin && (
          <>
            <div style={sectionHeaderStyle}>Administration</div>
            <button onClick={() => setView("admin-members")} style={navItemStyle(currentView === "admin-members")}>
              <Icons.Team /> User Management
            </button>
            <button onClick={() => setView("admin-audit")} style={navItemStyle(currentView === "admin-audit")}>
              <Icons.Overview /> Audit Logs
            </button>
            <button onClick={() => setView("admin-security")} style={navItemStyle(currentView === "admin-security")}>
              <Icons.Security /> Security Settings
            </button>
          </>
        )}

        <div style={sectionHeaderStyle}>Settings</div>
        <button onClick={() => setView("settings")} style={navItemStyle(currentView === "settings")}>
          <Icons.Security /> Profile & Preferences
        </button>
      </div>

      {/* Security Badge & Logout Footer */}
      <div style={{
        padding: "14px 16px",
        borderTop: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "var(--bg-secondary)"
      }}>
        <div style={{
          fontSize: "10.5px",
          color: "var(--text-muted)",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          fontWeight: 600,
          background: "var(--bg-hover)",
          padding: "6px",
          borderRadius: "6px",
          border: "1px solid var(--border-color)"
        }}>
          <span>🔒 256-Bit Encrypted</span>
          <span>•</span>
          <span>SOC2 Ready</span>
        </div>

        <button onClick={onLogout} style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "8px 12px",
          background: "none",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-sm)",
          fontSize: "12.5px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          cursor: "pointer",
          justifyContent: "center",
          fontFamily: "inherit"
        }}>
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
