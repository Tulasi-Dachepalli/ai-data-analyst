// src/components/settings/CopilotSettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";

export default function CopilotSettings() {
  const { settings, updateSection } = useSettings();
  const copilot = settings.copilot;

  const toggle = (key) => {
    updateSection("copilot", { [key]: !copilot[key] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
        🤖 AI Copilot & Grounding Preferences
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-primary, #0F172A)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={copilot.showGroundingBadges} onChange={() => toggle("showGroundingBadges")} />
          <span>Show dataset version grounding badges</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={copilot.showEvidence} onChange={() => toggle("showEvidence")} />
          <span>Show evidence drawer action triggers</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={copilot.showProcessingActivity} onChange={() => toggle("showProcessingActivity")} />
          <span>Show processing activity stream in topbar</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={copilot.explainTransformations} onChange={() => toggle("explainTransformations")} />
          <span>Explain data transformations step-by-step</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={copilot.showConfidenceInfo} onChange={() => toggle("showConfidenceInfo")} />
          <span>Show statistical confidence intervals</span>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderTop: "1px solid var(--border-color, #E2E8F0)", paddingTop: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Response Style Tone
          </label>
          <select
            value={copilot.responseStyle}
            onChange={e => updateSection("copilot", { responseStyle: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option value="detailed">Detailed Executive Consulting — Default</option>
            <option value="concise">Concise Bullet Summary</option>
            <option value="technical">Technical Code & Formula Emphasis</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Default Copilot Investigation Mode
          </label>
          <select
            value={copilot.defaultMode}
            onChange={e => updateSection("copilot", { defaultMode: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option value="business_analysis">Business Analysis</option>
            <option value="data_quality">Data Quality & Cleaning</option>
            <option value="anomaly_detection">Anomaly Detection</option>
            <option value="model_explain">ML Model Explanation</option>
          </select>
        </div>
      </div>
    </div>
  );
}
