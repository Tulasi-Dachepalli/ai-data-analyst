// src/components/import/ImportProgress.jsx
import React from "react";

export default function ImportProgress({ steps, fileName }) {
  return (
    <div style={{ background: "#0F172A", color: "#FFFFFF", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Visual Import Pipeline
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
            Importing File: {fileName || "Dataset"}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8", padding: "4px 10px", borderRadius: 12 }}>
          ● Processing Pipeline
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((step, idx) => {
          const isDone = step.status === "completed";
          const isCurrent = step.status === "active";
          return (
            <div key={idx} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: isCurrent ? "rgba(255,255,255,0.1)" : "transparent",
              fontSize: 13
            }}>
              <span style={{
                fontWeight: 800,
                color: isDone ? "#4ADE80" : isCurrent ? "#38BDF8" : "#64748B",
                width: 20
              }}>
                {isDone ? "✓" : isCurrent ? "●" : "○"}
              </span>
              <span style={{
                color: isDone ? "#FFFFFF" : isCurrent ? "#38BDF8" : "#94A3B8",
                fontWeight: isCurrent ? 800 : 500,
                flex: 1
              }}>
                {step.label}
              </span>
              {isDone && <span style={{ fontSize: 11, color: "#4ADE80" }}>Done</span>}
              {isCurrent && <span style={{ fontSize: 11, color: "#38BDF8", fontStyle: "italic" }}>Running...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
