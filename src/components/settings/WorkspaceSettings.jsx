// src/components/settings/WorkspaceSettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";

export default function WorkspaceSettings() {
  const { settings, updateSection } = useSettings();
  const ws = settings.workspace;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
        🌐 Workspace & Regional Preferences
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Workspace Name
          </label>
          <input
            type="text"
            value={ws.name}
            onChange={e => updateSection("workspace", { name: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Company / Organization
          </label>
          <input
            type="text"
            value={ws.company}
            onChange={e => updateSection("workspace", { company: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Timezone
          </label>
          <select
            value={ws.timezone}
            onChange={e => updateSection("workspace", { timezone: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option>UTC-5 (Eastern Time)</option>
            <option>UTC+0 (Greenwich Mean Time)</option>
            <option>UTC+5:30 (India Standard Time)</option>
            <option>UTC+9 (Japan Standard Time)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Date Format
          </label>
          <select
            value={ws.dateFormat}
            onChange={e => updateSection("workspace", { dateFormat: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option>YYYY-MM-DD (ISO 8601)</option>
            <option>MM/DD/YYYY (US Standard)</option>
            <option>DD/MM/YYYY (EU Standard)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
            Primary Currency
          </label>
          <select
            value={ws.currency}
            onChange={e => updateSection("workspace", { currency: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #CBD5E1)", fontSize: 13, background: "var(--bg-primary, #F8FAFC)", color: "var(--text-primary, #0F172A)" }}
          >
            <option>USD ($)</option>
            <option>INR (₹)</option>
            <option>EUR (€)</option>
            <option>GBP (£)</option>
          </select>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border-color, #E2E8F0)", paddingTop: 16 }}>
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary, #64748B)", marginBottom: 6 }}>
          UI Layout Density
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          {["comfortable", "compact"].map(d => (
            <label key={d} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="radio"
                name="density"
                checked={ws.density === d}
                onChange={() => updateSection("workspace", { density: d })}
              />
              <span style={{ textTransform: "capitalize" }}>{d} density</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
