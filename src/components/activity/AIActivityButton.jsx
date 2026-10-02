// src/components/activity/AIActivityButton.jsx
import React from "react";
import { useActivity } from "../../context/ActivityContext";

export default function AIActivityButton() {
  const { isProcessing, events, openActivityDrawer } = useActivity();

  return (
    <button
      onClick={openActivityDrawer}
      style={{
        background: isProcessing ? "#EFF6FF" : "var(--bg-primary, #F8FAFC)",
        border: `1px solid ${isProcessing ? "#BFDBFE" : "var(--border-color, #E2E8F0)"}`,
        borderRadius: 20,
        padding: "5px 12px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        transition: "all 0.15s ease"
      }}
    >
      <span style={{ fontSize: 13 }}>🤖</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
        AI Activity
      </span>
      <span style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: isProcessing ? "#2563EB" : "#16A34A",
        background: isProcessing ? "#DBEAFE" : "#DCFCE7",
        padding: "2px 7px",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: 4
      }}>
        {isProcessing ? "● Processing" : `✓ ${events.length} Steps`}
      </span>
    </button>
  );
}
