// src/components/settings/DataSettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";

export default function DataSettings() {
  const { settings, updateSection } = useSettings();
  const data = settings.data;

  const toggle = (key) => {
    updateSection("data", { [key]: !data[key] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
        📥 Data Import & Default Engine Rules
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-primary, #0F172A)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={data.detectTypes} onChange={() => toggle("detectTypes")} />
          <span>Auto-detect column data types</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={data.detectDates} onChange={() => toggle("detectDates")} />
          <span>Auto-detect date string patterns</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={data.detectDuplicates} onChange={() => toggle("detectDuplicates")} />
          <span>Auto-detect duplicate row hashes</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={data.detectMissing} onChange={() => toggle("detectMissing")} />
          <span>Auto-detect missing value patterns</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={data.createQualityReport} onChange={() => toggle("createQualityReport")} />
          <span>Generate automated quality report</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={data.automaticVersioning} onChange={() => toggle("automaticVersioning")} />
          <span>Enable incremental versioning (v1 → vN)</span>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderTop: "1px solid var(--border-color, #E2E8F0)", paddingTop: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Default Table Preview Rows
          </label>
          <select
            value={data.previewRows}
            onChange={e => updateSection("data", { previewRows: Number(e.target.value) })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows (Default)</option>
            <option value={250}>250 rows</option>
            <option value={500}>500 rows</option>
          </select>
        </div>
      </div>
    </div>
  );
}
