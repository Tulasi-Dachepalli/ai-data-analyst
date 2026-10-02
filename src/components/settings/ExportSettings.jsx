// src/components/settings/ExportSettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";

export default function ExportSettings() {
  const { settings, updateSection } = useSettings();
  const exp = settings.export;

  const toggle = (key) => {
    updateSection("export", { [key]: !exp[key] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
        💳 Executive Export & Deck Defaults
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Default Export Deck Format
          </label>
          <select
            value={exp.defaultFormat}
            onChange={e => updateSection("export", { defaultFormat: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option value="PDF">PDF Presentation Deck — Default</option>
            <option value="PPTX">PowerPoint (.pptx) Deck</option>
            <option value="EXCEL">Excel Data Workbook (.xlsx)</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-primary, #0F172A)", borderTop: "1px solid var(--border-color, #E2E8F0)", paddingTop: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={exp.includeCharts} onChange={() => toggle("includeCharts")} />
          <span>Include high-resolution chart images</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={exp.includeEvidence} onChange={() => toggle("includeEvidence")} />
          <span>Include grounded evidence tables</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={exp.includeLineage} onChange={() => toggle("includeLineage")} />
          <span>Include complete data lineage stack</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={exp.includeMethodology} onChange={() => toggle("includeMethodology")} />
          <span>Include AutoML & statistical methodology</span>
        </label>
      </div>
    </div>
  );
}
