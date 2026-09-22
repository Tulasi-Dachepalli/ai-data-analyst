import { useState } from "react";

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
          <h2 style={{ margin: 0, fontSize: 22, color: "var(--text-primary)", fontWeight: 800 }}>⚙ System Settings & Governance</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            Configure workspace preferences, enterprise role access, AI copilot behaviors, and data retention policies.
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
          { id: "roles", label: "🛡 Role & Access Controls", icon: "🛡" },
          { id: "ai", label: "🤖 AI Copilot Preferences", icon: "🤖" },
          { id: "data", label: "💾 Data & Storage Retention", icon: "💾" },
          { id: "security", label: "🔐 Security & SOC2 Trust", icon: "🔐" },
          { id: "plan", label: "💳 Plan & Usage Billing", icon: "💳" }
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
        {activeTab === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Workspace Preferences</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Company Workspace Name</label>
                <input
                  type="text"
                  value={user?.companyName || "Acme Enterprise"}
                  onChange={(e) => onUserChange && onUserChange({ ...user, companyName: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--bg-primary)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>User Email</label>
                <input
                  type="text"
                  value={user?.email || "demo.executive@enterprise.com"}
                  disabled
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--bg-hover)", opacity: 0.8 }}
                />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Default Interface Language</label>
                <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--bg-primary)" }}>
                  <option>English (US) — Default</option>
                  <option>Spanish (Español)</option>
                  <option>French (Français)</option>
                  <option>German (Deutsch)</option>
                  <option>Japanese (日本語)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Theme Appearance</label>
                <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--bg-primary)" }}>
                  <option>Clean Executive Light</option>
                  <option>Dark Midnight Analytics</option>
                  <option>System Default</option>
                </select>
              </div>
            </div>
          </div>
        )}

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

        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>AI Copilot Engine Preferences</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Response Tone & Style</label>
                <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--bg-primary)" }}>
                  <option>Executive Consulting (Clear, Concise, Actionable) — Default</option>
                  <option>Technical Analytical (Detailed Stats & Formulae)</option>
                  <option>SaaS Metric Focused (Growth & Churn Emphasis)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Primary AI Reasoning Engine</label>
                <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: 13, background: "var(--bg-primary)" }}>
                  <option>Claude 3.5 Sonnet / Gemini Pro (Balanced High-Precision)</option>
                  <option>Fast Local Deterministic Heuristics (Offline Capable)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Data Storage & Lineage Retention</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>🔒 Raw Data Lineage Protection</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Original uploaded CSV/XLSX files are stored immutably as <strong>Version v1.0 Raw</strong>. All data cleaning transformations are saved as incremental non-destructive lineage versions (v1.1 Cleaned).
                </div>
              </div>
              <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>⚡ Auto-Save Interval</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Interactive thread messages, EDA visualizations, and trained model parameters are automatically saved to your enterprise workspace account.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Security Compliance & Audit Trail</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <div>
                  <strong style={{ color: "#10B981" }}>256-Bit AES Data Encryption</strong> — End-to-end transport and at-rest database storage encryption.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 18 }}>🛡</span>
                <div>
                  <strong style={{ color: "#3B82F6" }}>Multi-Tenant Data Isolation Guard</strong> — All workspace tables strictly filtered by company_id.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Subscription Tier & Usage Credits</h3>
            <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#FFFFFF", borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#F59E0B" }}>Current Subscription</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Enterprise Pro Tier Active</div>
                <div style={{ fontSize: 12.5, color: "#94A3B8", marginTop: 4 }}>Unlimited workspace tokens & 25-test security suite verification enabled.</div>
              </div>
              <span style={{ background: "#F59E0B", color: "#000", fontWeight: 800, padding: "6px 14px", borderRadius: 20, fontSize: 12 }}>PRO UNLOCKED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
