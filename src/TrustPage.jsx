import { useState } from "react";

export default function TrustPage({ onBack }) {
  const complianceChecklist = [
    { title: "Multi-tenant Database Isolation", desc: "Logical scoping of all tables and datasets by company_id", status: "completed" },
    { title: "Session Invalidation on Password Change", desc: "Instantly invalidates all active login sessions on password edits", status: "completed" },
    { title: "Tamper-Evident Security Audit Trails", desc: "Write-only logging blocking any UPDATE or DELETE operations", status: "completed" },
    { title: "Password Re-authentication", desc: "Requires password verification before dangerous workspace purges", status: "completed" },
    { title: "Workspace Soft-Deletion", desc: "Prevents accidental data loss by preserving files in a 30-day grace period", status: "completed" },
    { title: "Zero-Training LLM API Binding", desc: "Model queries explicitly configured to prevent training on client data", status: "completed" }
  ];

  return (
    <div style={{ padding: "10px 4px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#2B2A27", fontWeight: 700 }}>🛡️ Trust & Security Center</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#8A8580" }}>Documented compliance checklists, security standards, and data isolation controls.</p>
        </div>
        {onBack && (
          <button onClick={onBack}
            style={{ fontSize: 12, fontWeight: 600, color: "#5C584F", background: "none", border: "1px solid #DDD8CE", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            ← Back
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, alignItems: "start" }}>
        {/* Left Column: Security Practices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Encryption Card */}
          <div style={{ border: "1px solid #EAE7E0", borderRadius: 12, padding: 16, background: "#FFFDF9", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#3E6F8E" }}>🔒 Data Encryption Practices</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "#5C584F" }}>
              <div>
                <strong>In Transit:</strong> Encrypted using TLS 1.3/HTTPS everywhere. High-strength ciphers enforce secure connections between browser and server endpoints.
              </div>
              <div style={{ borderTop: "1px solid #F3EFE9", paddingTop: 8 }}>
                <strong>At Rest:</strong> Encrypted using industry-standard AES-256 keys. Tables, datasets, and schema definitions are stored on secure encrypted disks.
              </div>
            </div>
          </div>

          {/* Data Isolation Card */}
          <div style={{ border: "1px solid #EAE7E0", borderRadius: 12, padding: 16, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#3E6F8E" }}>🗂️ Logical Tenant Isolation</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "#5C584F", lineHeight: 1.5 }}>
              All database records, datasets, usage metrics, and audit logs are strictly scoped by a secure <code style={{ background: "#F7F5F0", padding: "2px 4px", borderRadius: 4 }}>company_id</code> parameter. 
              Cross-tenant access queries are rejected at API controllers, preventing one company's information from ever reaching another user's workspace dashboard or prompt context.
            </p>
          </div>

          {/* AI Privacy Policy */}
          <div style={{ border: "1px solid #EAE7E0", borderRadius: 12, padding: 16, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#3E6F8E" }}>🤖 Zero-Training LLM Policy</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "#5C584F", lineHeight: 1.5 }}>
              We leverage API endpoints from Anthropic and Google Cloud. Under commercial terms of service, queries submitted to model APIs are strictly prohibited from being retained or used for training models or adjusting weights.
            </p>
          </div>
        </div>

        {/* Right Column: SOC 2 Checklist */}
        <div style={{ border: "1px solid #EAE7E0", borderRadius: 12, padding: 16, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: 14, fontWeight: 700, color: "#2B2A27" }}>📋 SOC 2 Type II Readiness Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {complianceChecklist.map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "start", borderBottom: idx < complianceChecklist.length - 1 ? "1px solid #F7F5F0" : "none", paddingBottom: idx < complianceChecklist.length - 1 ? 12 : 0 }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>✅</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2B2A27" }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#8A8580", marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subprocessors list */}
      <div style={{ border: "1px solid #EAE7E0", borderRadius: 12, padding: 16, background: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, color: "#2B2A27" }}>🏢 Third-Party Subprocessors</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left", marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #EAE7E0", color: "#8A8580" }}>
              <th style={{ paddingBottom: 6 }}>Subprocessor</th>
              <th style={{ paddingBottom: 6 }}>Service Description</th>
              <th style={{ paddingBottom: 6 }}>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #F7F5F0" }}>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>PostgreSQL (AWS RDS)</td>
              <td style={{ padding: "8px 0" }}>Relational Database Storage</td>
              <td style={{ padding: "8px 0" }}>United States (East)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #F7F5F0" }}>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>Vercel / Render</td>
              <td style={{ padding: "8px 0" }}>Frontend Hosting and Cloud Computing</td>
              <td style={{ padding: "8px 0" }}>Global Edge Network</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>Anthropic / Google Cloud</td>
              <td style={{ padding: "8px 0" }}>AI Language Model API Engines</td>
              <td style={{ padding: "8px 0" }}>United States (Multiple)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
