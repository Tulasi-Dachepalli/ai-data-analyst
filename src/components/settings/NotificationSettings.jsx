// src/components/settings/NotificationSettings.jsx
import React from "react";
import { useSettings } from "../../context/SettingsContext";

export default function NotificationSettings() {
  const { settings, updateSection } = useSettings();
  const notifs = settings.notifications;

  const toggle = (key) => {
    updateSection("notifications", { [key]: !notifs[key] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
        🔔 Notification Dispatch & Alert Subscriptions
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "var(--text-primary, #0F172A)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={notifs.processingCompleted} onChange={() => toggle("processingCompleted")} />
          <span>Dataset import processing completed</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={notifs.cleaningCompleted} onChange={() => toggle("cleaningCompleted")} />
          <span>Data cleaning operation completed</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={notifs.modelCompleted} onChange={() => toggle("modelCompleted")} />
          <span>ML model training completed</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={notifs.forecastCompleted} onChange={() => toggle("forecastCompleted")} />
          <span>Time-series forecast generated</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={notifs.qualityWarnings} onChange={() => toggle("qualityWarnings")} />
          <span>Data quality anomaly warnings</span>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--bg-primary, #F8FAFC)", padding: 12, borderRadius: 8, border: "1px solid var(--border-color, #E2E8F0)" }}>
          <input type="checkbox" checked={notifs.securityEvents} onChange={() => toggle("securityEvents")} />
          <span>Security & RBAC restriction events</span>
        </label>
      </div>
    </div>
  );
}
