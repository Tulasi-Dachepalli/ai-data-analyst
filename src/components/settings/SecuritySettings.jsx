// src/components/settings/SecuritySettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";
import SecurityOperationsCenter from "../security/SecurityOperationsCenter";
import SensitiveDataControls from "../security/SensitiveDataControls";

export default function SecuritySettings() {
  const { settings, updateSection } = useSettings();
  const sec = settings?.security || {};

  const toggle = (key) => {
    updateSection("security", { [key]: !sec[key] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Embedded Security Operations Center */}
      <SecurityOperationsCenter />

      {/* Sensitive Data Controls */}
      <SensitiveDataControls />

      {/* Security Policies Matrix */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
          ⚙️ Workspace Security Policy Configuration
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-primary, #0F172A)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
            <input type="checkbox" checked={Boolean(sec.requireConfirmation)} onChange={() => toggle("requireConfirmation")} />
            <span>Require confirmation before destructive mutations</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
            <input type="checkbox" checked={Boolean(sec.keepTransformationHistory)} onChange={() => toggle("keepTransformationHistory")} />
            <span>Keep immutable transformation version stack</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
            <input type="checkbox" checked={Boolean(sec.keepAuditHistory)} onChange={() => toggle("keepAuditHistory")} />
            <span>Keep full AI activity audit logs</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
            <input type="checkbox" checked={Boolean(sec.maskSensitiveColumns)} onChange={() => toggle("maskSensitiveColumns")} />
            <span>Automatically detect and mask sensitive columns</span>
          </label>
        </div>
      </div>
    </div>
  );
}
