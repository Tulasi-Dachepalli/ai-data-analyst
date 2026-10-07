// src/components/common/LegalHelpModal.jsx
import React from "react";

export default function LegalHelpModal({ isOpen, onClose, tab = "privacy" }) {
  const [activeTab, setActiveTab] = React.useState(tab);

  React.useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
      }}
    >
      <div data-testid="legal-help-modal" style={{
        backgroundColor: "#FFFFFF",
        width: 640,
        maxWidth: "95vw",
        maxHeight: "85vh",
        borderRadius: 14,
        boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #CBD5E1"
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 22px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Support & Legal Information</h3>
              <div style={{ fontSize: 11.5, color: "#94A3B8" }}>AI Business Copilot Compliance & Trust Center</div>
            </div>
          </div>
          <button
            data-testid="legal-modal-close-btn"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#FFF",
              width: 28,
              height: 28,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", padding: "0 16px" }}>
          {[
            { id: "privacy", label: "🔒 Privacy Policy" },
            { id: "terms", label: "📜 Terms of Service" },
            { id: "help", label: "❓ Help & Docs" },
            { id: "contact", label: "✉️ Contact Support" }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 14px",
                border: "none",
                background: "transparent",
                fontSize: 12.5,
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? "#2563EB" : "#64748B",
                borderBottom: activeTab === t.id ? "2px solid #2563EB" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: "22px", overflowY: "auto", fontSize: 13.5, color: "#334155", lineHeight: 1.6, flex: 1 }}>
          {activeTab === "privacy" && (
            <div>
              <h4 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: 16 }}>Privacy Policy & Data Security</h4>
              <p><strong>1. Zero Data Retention:</strong> Your uploaded business datasets, CSVs, and Excel files are parsed client-side in your browser. We never store, sell, or use your private data to train public foundation models.</p>
              <p><strong>2. PII Protection:</strong> Automatic regex scanning scrubs Personally Identifiable Information (such as emails, phone numbers, and SSNs) before running statistical summaries.</p>
              <p><strong>3. Role Access Controls:</strong> Restricted fields (such as salary and executive bonuses) are masked according to the role configuration you select.</p>
              <p><strong>4. Local Storage:</strong> Workspace session states and language preferences are retained locally in your browser storage and can be cleared at any time via Reset Workspace.</p>
            </div>
          )}

          {activeTab === "terms" && (
            <div>
              <h4 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: 16 }}>Terms of Service</h4>
              <p><strong>1. Intellectual Property:</strong> You maintain 100% full ownership and intellectual property rights over all data, insights, generated charts, and exported PDF reports created using this platform.</p>
              <p><strong>2. Fair Usage:</strong> Standard accounts include 50 complimentary AI analysis credits. Additional processing may require active API keys or enterprise subscriptions.</p>
              <p><strong>3. Disclaimer:</strong> Analytical forecasts, anomaly detections, and automated statistical interpretations are generated by algorithmic models and are provided for executive decision-support purposes.</p>
            </div>
          )}

          {activeTab === "help" && (
            <div>
              <h4 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: 16 }}>Help, Documentation & FAQ</h4>
              <p><strong>• How do I start?</strong> Upload any tabular file (.csv, .xlsx) on the landing page or click "+ New analysis" in the sidebar.</p>
              <p><strong>• What is Beginner Guided Mode?</strong> Guided Mode spotlights a single recommended next action at every stage, guiding you from data upload through automated PDF report generation without complex formulas.</p>
              <p><strong>• How are KPIs calculated?</strong> Every metric displays a "How calculated" description showing the active dataset formula, filter state, and dataset version.</p>
              <p><strong>• How do I switch languages?</strong> Use the language dropdown in the top header to select from 7 supported languages (English, Telugu, Hindi, Spanish, French, German, Japanese).</p>
            </div>
          )}

          {activeTab === "contact" && (
            <div>
              <h4 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: 16 }}>Contact Support & Engineering</h4>
              <p>Have questions, feature suggestions, or need custom enterprise integration support?</p>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, marginTop: 10 }}>
                <div><strong>Lead Engineer:</strong> Tulasi Dachepalli</div>
                <div style={{ marginTop: 4 }}><strong>Email:</strong> support@ai-data-analyst.com</div>
                <div style={{ marginTop: 4 }}><strong>GitHub Issues:</strong> <a href="https://github.com/Tulasi-Dachepalli/ai-data-analyst/issues" target="_blank" rel="noreferrer" style={{ color: "#2563EB" }}>github.com/Tulasi-Dachepalli/ai-data-analyst</a></div>
                <div style={{ marginTop: 4 }}><strong>Live Status:</strong> Active • Cloud sync & in-browser engines operational</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "7px 18px",
              background: "#0F172A",
              color: "#FFF",
              border: "none",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
