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
              <h4 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: 16 }}>Privacy Policy & Data Security Architecture</h4>
              <p><strong>1. In-Browser Local Processing (Guest & Sandbox Mode):</strong> Uploaded CSV, Excel, and JSON files are parsed and profiled client-side in your browser's JavaScript memory sandbox. In guest sessions, data remains strictly in local browser session memory (IndexedDB/sessionStorage) with zero network transmission to persistent backend databases.</p>
              <p><strong>2. Enterprise Cloud Storage & Tenant Isolation:</strong> For registered organizations that explicitly save datasets, data in transit is protected via TLS 1.3 / HTTPS. Storage is hosted in tenant-isolated PostgreSQL with query-level tenant boundaries (<code>company_id</code> scoping). Volume-level encryption at rest uses provider-managed AES-256 (AWS RDS / Supabase managed infrastructure).</p>
              <p><strong>3. AI Provider Retention & Zero Model Training:</strong> AI assistance transmits aggregate column statistics and prompts over encrypted TLS to commercial foundation model APIs (OpenAI / Anthropic / Google Gemini API). Under standard commercial API terms: customer inputs and completions are not used to train or fine-tune public foundation models. AI providers retain stateless API logs for up to 30 days strictly for security and abuse monitoring, after which logs are permanently expunged.</p>
              <p><strong>4. Automated Client-Side PII Masking:</strong> Automated heuristic and regex pattern matching detects sensitive personal data (such as emails, telephone numbers, and SSNs) before metrics are visualized or exported.</p>
              <p><strong>5. Data Retention & User-Initiated Permanent Deletion:</strong> Guest session records are wiped when the browser tab is closed or session cache is reset. Authenticated users can trigger immediate, permanent deletion of any dataset, version snapshot, or chat history at any time from the Manage Data view with irreversible purging.</p>
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
