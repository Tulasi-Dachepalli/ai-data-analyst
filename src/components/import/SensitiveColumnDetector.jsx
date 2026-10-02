// src/components/import/SensitiveColumnDetector.jsx
import React, { useState } from "react";

export default function SensitiveColumnDetector({ columns = [], onConfirm }) {
  const sensitivePatterns = ["salary", "email", "phone", "ssn", "employee_id", "credit_card", "address", "payroll"];
  const detected = columns.filter(col =>
    sensitivePatterns.some(pat => col.toLowerCase().includes(pat))
  );

  const [actionChoice, setActionChoice] = useState("mask");

  if (detected.length === 0) return null;

  return (
    <div style={{
      background: "#FFFBEB",
      border: "1px solid #FCD34D",
      borderRadius: 12,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#92400E" }}>
            Sensitive / PII Columns Detected ({detected.length} columns)
          </div>
          <div style={{ fontSize: 12, color: "#B45309" }}>
            The import scanner identified potentially sensitive fields in your dataset.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {detected.map(col => (
          <span key={col} style={{
            fontSize: 11.5,
            fontWeight: 700,
            background: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #FDE68A",
            padding: "3px 10px",
            borderRadius: 6
          }}>
            🔒 {col}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
        <button
          onClick={() => { setActionChoice("mask"); if (onConfirm) onConfirm("mask", detected); }}
          style={{
            background: "#D97706",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          🔒 Mask Sensitive Columns
        </button>
        <button
          onClick={() => { setActionChoice("keep"); if (onConfirm) onConfirm("keep", detected); }}
          style={{
            background: "#FFFFFF",
            color: "#78350F",
            border: "1px solid #FCD34D",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Keep Visible (Unmasked)
        </button>
      </div>
    </div>
  );
}
