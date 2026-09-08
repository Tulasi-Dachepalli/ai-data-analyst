import React from "react";

export default function EvidenceAnswerCard({
  answer = "",
  why = "",
  evidence = "",
  recommendedAction = "",
  dataFreshness = "Evaluated live from active dataset",
  rowCount = null
}) {
  return (
    <div style={{
      backgroundColor: "var(--bg-secondary, #F8FAFC)",
      border: "1px solid var(--border-color, #E2E8F0)",
      borderRadius: "14px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      fontFamily: "var(--font-sans, sans-serif)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
    }}>
      {/* Answer */}
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "18px" }}>💡</span>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted, #64748B)" }}>
            ANSWER
          </div>
          <div style={{ fontSize: "14.5px", fontWeight: 700, color: "var(--text-primary, #0F172A)", marginTop: "2px" }}>
            {answer}
          </div>
        </div>
      </div>

      {/* Why */}
      {why && (
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", paddingLeft: "28px" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary, #334155)", lineHeight: "1.5" }}>
            <strong>Why:</strong> {why}
          </div>
        </div>
      )}

      {/* Evidence */}
      {evidence && (
        <div style={{
          marginLeft: "28px",
          padding: "10px 14px",
          backgroundColor: "rgba(37, 99, 235, 0.05)",
          border: "1px solid rgba(37, 99, 235, 0.15)",
          borderRadius: "8px",
          fontSize: "12.5px",
          color: "#1E40AF"
        }}>
          <strong>📊 Verified Evidence:</strong> {evidence}
        </div>
      )}

      {/* Recommended Action */}
      {recommendedAction && (
        <div style={{
          marginLeft: "28px",
          padding: "10px 14px",
          backgroundColor: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: "8px",
          fontSize: "12.5px",
          color: "#166534"
        }}>
          <strong>🎯 Recommended Action:</strong> {recommendedAction}
        </div>
      )}

      {/* Data Freshness Timestamp */}
      <div style={{
        marginLeft: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "11px",
        color: "var(--text-muted, #94A3B8)",
        borderTop: "1px solid var(--border-color, #E2E8F0)",
        paddingTop: "8px"
      }}>
        <span>🕒 Data Freshness: {dataFreshness}</span>
        {rowCount && <span>✓ Evaluated across {rowCount.toLocaleString()} rows</span>}
      </div>
    </div>
  );
}
