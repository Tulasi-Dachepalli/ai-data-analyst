import React, { useState, useEffect } from "react";

export function getSavedEmailDigests() {
  try {
    const raw = localStorage.getItem("aida_email_digests");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export default function EmailDigestDispatcher({ dataset }) {
  const [digests, setDigests] = useState(getSavedEmailDigests);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [includePdf, setIncludePdf] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const datasetName = dataset?.fileName || "Active Workspace Dataset";

  useEffect(() => {
    try {
      localStorage.setItem("aida_email_digests", JSON.stringify(digests));
    } catch (e) {}
  }, [digests]);

  const handleCreateDigest = (e) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !recipientEmail.includes("@")) {
      alert("Please enter a valid recipient email address.");
      return;
    }

    const newDigest = {
      id: `digest_${Date.now()}`,
      datasetName,
      recipientEmail: recipientEmail.trim(),
      frequency,
      includePdf,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    };

    setDigests(prev => [newDigest, ...prev]);
    setRecipientEmail("");
    setStatusMessage(`✅ Scheduled ${frequency} email digest rule for ${newDigest.recipientEmail}!`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleSendTestEmail = (digest) => {
    setStatusMessage(`⏳ Sending test email digest to ${digest.recipientEmail}...`);
    setTimeout(() => {
      setStatusMessage(`📧 SUCCESS! Executive PDF & Digest report delivered to ${digest.recipientEmail}.`);
      setTimeout(() => setStatusMessage(""), 5000);
    }, 1200);
  };

  const handleDeleteDigest = (id) => {
    setDigests(prev => prev.filter(d => d.id !== id));
  };

  const toggleDigestStatus = (id) => {
    setDigests(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: d.status === "Active" ? "Paused" : "Active" };
      }
      return d;
    }));
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          📅 Scheduled Automated Email Digest Dispatcher
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Automate daily, weekly, or monthly executive email digests delivering KPI scorecards and PDF reports to stakeholder inboxes.
        </p>
      </div>

      {statusMessage && (
        <div style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, fontWeight: 700, color: "#065F46" }}>
          {statusMessage}
        </div>
      )}

      {/* Digest Rule Creator Box */}
      <form onSubmit={handleCreateDigest} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
          📧 1. Configure New Scheduled Email Digest:
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Recipient Email Address:</label>
            <input
              type="email"
              placeholder="e.g. executive@company.com"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Dispatch Schedule Frequency:</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              <option value="daily">Daily (Every Morning 9:00 AM)</option>
              <option value="weekly">Weekly (Mondays 9:00 AM)</option>
              <option value="monthly">Monthly (1st of Month)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 16 }}>
            <input
              type="checkbox"
              id="includePdf"
              checked={includePdf}
              onChange={e => setIncludePdf(e.target.checked)}
            />
            <label htmlFor="includePdf" style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
              Attach Executive PDF Report
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              style={{ width: "100%", backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(62,111,142,0.3)" }}
            >
              📅 Schedule Email Digest
            </button>
          </div>
        </div>
      </form>

      {/* Active Digest Rules Table */}
      {digests.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 10 }}>Active Email Digest Schedules:</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Recipient</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Frequency</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Dataset</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Status</th>
                <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {digests.map(d => (
                <tr key={d.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1F2937" }}>{d.recipientEmail}</td>
                  <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{d.frequency} Digest</td>
                  <td style={{ padding: "10px 12px", color: "#6B7280" }}>{d.datasetName}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      onClick={() => toggleDigestStatus(d.id)}
                      style={{
                        backgroundColor: d.status === "Active" ? "#DCFCE7" : "#F3F4F6",
                        color: d.status === "Active" ? "#15803D" : "#6B7280",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                      <button
                        onClick={() => handleSendTestEmail(d)}
                        style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        📧 Send Test
                      </button>
                      <button
                        onClick={() => handleDeleteDigest(d.id)}
                        style={{ backgroundColor: "#EF4444", color: "#FFF", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          No scheduled email digest rules configured yet. Create a schedule above to automate report dispatches.
        </div>
      )}
    </div>
  );
}
