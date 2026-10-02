import React, { useState } from "react";
import WorkspaceSettings from "./components/settings/WorkspaceSettings";
import DataSettings from "./components/settings/DataSettings";
import CopilotSettings from "./components/settings/CopilotSettings";
import NotificationSettings from "./components/settings/NotificationSettings";
import SecuritySettings from "./components/settings/SecuritySettings";
import ExportSettings from "./components/settings/ExportSettings";

export default function SettingsPage({ user, onUserChange, onBack }) {
  const [activeTab, setActiveTab] = useState("general");
  const role = user?.role || "ceo";

  const handleRoleSelect = (nextRole) => {
    const updatedUser = { ...(user || {}), role: nextRole };
    if (onUserChange) {
      onUserChange(updatedUser);
    } else {
      localStorage.setItem("aida_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1080, margin: "0 auto", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "var(--text-primary)", fontWeight: 800 }}>⚙ System Settings & Governance Control Center</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Configure workspace preferences, enterprise role access, AI copilot behaviors, data rules, and export options.
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
            ← Back to Workspace
          </button>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-color)", paddingBottom: 8, overflowX: "auto" }}>
        {[
          { id: "general", label: "🌐 General & Workspace", icon: "🌐" },
          { id: "roles", label: "🛡 Role Scope & RBAC", icon: "🛡" },
          { id: "ai", label: "🤖 AI Copilot Rules", icon: "🤖" },
          { id: "data", label: "📥 Data Import & Retention", icon: "📥" },
          { id: "notifications", label: "🔔 Alerts & Notifications", icon: "🔔" },
          { id: "security", label: "🔐 Security & SOC (OWASP 2025)", icon: "🔐" },
          { id: "export", label: "💳 Export Deck Rules", icon: "💳" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: activeTab === t.id ? 700 : 500,
              backgroundColor: activeTab === t.id ? "var(--accent-color, #0F172A)" : "transparent",
              color: activeTab === t.id ? "#FFFFFF" : "var(--text-secondary)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24 }}>
        {activeTab === "general" && <WorkspaceSettings />}

        {activeTab === "roles" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Active Role & Capabilities Scope</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              The selected role configures your front page command center, KPI metrics, AI briefs, and RBAC authorization guard.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                { id: "ceo", label: "👔 CEO / Executive", desc: "Executive KPIs, Revenue Trends, Risk Briefs" },
                { id: "hr", label: "👥 HR Manager", desc: "Headcount, Retention Risk, Attrition Heatmaps" },
                { id: "recruiter", label: "🎯 Recruiter", desc: "Open Requisitions, Hiring Funnel, Candidates" },
                { id: "finance", label: "💰 Finance", desc: "Budget Variance, Overspending, Net Margin" },
                { id: "data_analyst", label: "📊 Data Analyst", desc: "Dataset Profiling, Quality Index, BI Reports" },
                { id: "data_scientist", label: "🧪 Data Scientist", desc: "AutoML Leaderboards, Time-Series Forecasts" }
              ].map(rItem => (
                <div
                  key={rItem.id}
                  onClick={() => handleRoleSelect(rItem.id)}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: role === rItem.id ? "2px solid #2563EB" : "1px solid var(--border-color)",
                    backgroundColor: role === rItem.id ? "rgba(37, 99, 235, 0.05)" : "var(--bg-primary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: role === rItem.id ? "#2563EB" : "var(--text-primary)", marginBottom: 4 }}>
                    {rItem.label} {role === rItem.id && "✓"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{rItem.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 16, marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Role Permission Matrix:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5, color: "var(--text-secondary)" }}>
                <div>✓ Executive KPI Dashboard & AI Brief</div>
                <div>✓ Automated Data Quality & Imputation</div>
                <div>✓ 9-Stage Linear Progress Stepper</div>
                <div>✓ Multi-Tenant Data Isolation Enforcement</div>
                <div>✓ Prompt Injection Security Guard</div>
                <div>✓ 1-Click Executive PDF Deck & Export</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && <CopilotSettings />}

        {activeTab === "data" && <DataSettings />}

        {activeTab === "notifications" && <NotificationSettings />}

        {activeTab === "security" && <SecuritySettings />}

        {activeTab === "export" && <ExportSettings />}
      </div>
    </div>
  );
}
