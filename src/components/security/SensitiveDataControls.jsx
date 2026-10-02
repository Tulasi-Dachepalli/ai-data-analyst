// src/components/security/SensitiveDataControls.jsx
import React, { useState } from "react";

export default function SensitiveDataControls() {
  const [columns, setColumns] = useState([
    { name: "Salary", type: "Financial PII", visibility: "masked", aiAccess: true },
    { name: "Employee_Email", type: "Personal PII", visibility: "masked", aiAccess: true },
    { name: "Phone_Number", type: "Contact PII", visibility: "masked", aiAccess: false },
    { name: "SSN_TaxID", type: "Government ID", visibility: "restricted", aiAccess: false }
  ]);

  const updateVis = (name, vis) => {
    setColumns(prev => prev.map(c => c.name === name ? { ...c, visibility: vis } : c));
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>🔐 SENSITIVE DATA GOVERNANCE CONTROLS</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>Manage PII visibility, encryption masking, and AI access permissions.</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", padding: "4px 10px", borderRadius: 12 }}>
          ✓ Role-Aware Masking Active
        </span>
      </div>

      <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
              <th style={{ padding: "10px 14px" }}>Column Name</th>
              <th style={{ padding: "10px 14px" }}>Category</th>
              <th style={{ padding: "10px 14px" }}>Visibility Controls</th>
              <th style={{ padding: "10px 14px" }}>AI Access</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c, i) => (
              <tr key={c.name} style={{ borderBottom: i === columns.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0F172A" }}>🔒 {c.name}</td>
                <td style={{ padding: "10px 14px", color: "#475569" }}>{c.type}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["visible", "masked", "restricted"].map(vis => (
                      <label key={vis} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input
                          type="radio"
                          name={`vis-${c.name}`}
                          checked={c.visibility === vis}
                          onChange={() => updateVis(c.name, vis)}
                        />
                        <span style={{ textTransform: "capitalize" }}>{vis}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.aiAccess ? "#16A34A" : "#DC2626" }}>
                    {c.aiAccess ? "✓ Approved for Analysis" : "🚫 Restricted"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
