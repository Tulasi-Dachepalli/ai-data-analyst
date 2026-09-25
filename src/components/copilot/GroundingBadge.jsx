// src/components/copilot/GroundingBadge.jsx
import React from "react";

export default function GroundingBadge({ type = "dataset", version = "v4", records = 0, confidence = 0.98 }) {
  if (type === "dataset") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#059669", borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
        <span>✓ Grounded in Dataset {version}</span>
        {records > 0 && <span style={{ opacity: 0.8, fontWeight: 600 }}>• {records.toLocaleString()} records evaluated</span>}
      </div>
    );
  }

  if (type === "calculation") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(37, 99, 235, 0.25)", color: "#2563EB", borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
        <span>✓ Calculated from dataset</span>
        <span style={{ opacity: 0.8, fontWeight: 600 }}>• High Confidence</span>
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", color: "#D97706", borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      <span>ℹ AI Recommendation</span>
      <span style={{ opacity: 0.8, fontWeight: 600 }}>• Based on observed patterns</span>
    </div>
  );
}
