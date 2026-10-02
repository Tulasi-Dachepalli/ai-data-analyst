// src/components/settings/SecuritySettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";

export default function SecuritySettings() {
  const { settings, updateSection } = useSettings();
  const sec = settings.security;

  const toggle = (key) => {
    updateSection("security", { [key]: !sec[key] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
        🔐 Security, Data Privacy & RBAC Control Matrix
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-primary, #0F172A)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={sec.requireConfirmation} onChange={() => toggle("requireConfirmation")} />
          <span>Require confirmation before destructive ops</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={sec.keepTransformationHistory} onChange={() => toggle("keepTransformationHistory")} />
          <span>Keep immutable transformation version stack</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={sec.keepAuditHistory} onChange={() => toggle("keepAuditHistory")} />
          <span>Keep full AI activity audit logs</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={sec.maskSensitiveColumns} onChange={() => toggle("maskSensitiveColumns")} />
          <span>Automatically detect and mask sensitive columns</span>
        </label>
      </div>

      <div style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 10, padding: 16, marginTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary, #0F172A)", marginBottom: 8 }}>
          🛡 Active RBAC Capability Matrix
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "var(--text-secondary, #64748B)" }}>
          <div>✓ Multi-tenant company_id data isolation</div>
          <div>✓ Prompt injection jailbreak defense active</div>
          <div>✓ Role-scoped 9-stage workflow lock engine</div>
          <div>✓ 256-bit SHA-256 raw hash immutability</div>
        </div>
      </div>
    </div>
  );
}
