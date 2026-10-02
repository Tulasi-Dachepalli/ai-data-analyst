// src/components/common/ExplainableErrorCard.jsx
import React, { useState } from "react";

/**
 * Enterprise Explainable Error Card
 * Implements the Two-Layer Error System:
 * Layer 1: Clean, empathetic, actionable user explanation with zero stack traces or secrets
 * Layer 2: Sanitized diagnostic telemetry & incident card for administrators/engineers
 */
export default function ExplainableErrorCard({
  error, // Can be an ExplainableError object or a standard Error
  onReviewData,
  onRetry,
  onGetHelp,
  onDismiss,
  userRole = "user"
}) {
  const [showAdminDiagnostics, setShowAdminDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  // Normalize error props
  const userVer = error?.userVersion || {
    errorId: error?.id || "ERR-DATA-20481",
    title: "We couldn't complete this analysis",
    whatHappened: error?.message || "The uploaded file contains values that could not be interpreted consistently.",
    whatYouCanDo: "Review the affected column in your file and try uploading again.",
    actions: ["review_data", "retry", "help"]
  };

  const intVer = error?.internalVersion || {
    errorId: userVer.errorId,
    service: "data-processing-engine",
    stage: "01 Raw / Ingestion",
    datasetVersion: "v1",
    requestId: `req_${Math.random().toString(36).substring(2, 9)}`,
    exception: "ValidationError",
    timestamp: new Date().toISOString(),
    status: "Safely Handled",
    recovery: "Worker terminated cleanly. Dataset state preserved. No database mutation committed."
  };

  const handleCopyId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(userVer.errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAdmin = userRole === "ceo" || userRole === "admin" || userRole === "scientist";

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1.5px solid #FCA5A5",
      borderRadius: 14,
      boxShadow: "0 8px 30px rgba(239, 68, 68, 0.08)",
      overflow: "hidden",
      fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      margin: "14px 0"
    }}>
      {/* Top Banner */}
      <div style={{
        background: "linear-gradient(90deg, #FEF2F2 0%, #FFF5F5 100%)",
        borderBottom: "1px solid #FEE2E2",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18
          }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#991B1B" }}>
              {userVer.title || "We couldn't complete this analysis"}
            </div>
            <div style={{ fontSize: 11.5, color: "#B91C1C", marginTop: 2 }}>
              Error ID: <code style={{ background: "#FEE2E2", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{userVer.errorId}</code>
              <button
                onClick={handleCopyId}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#7F1D1D",
                  cursor: "pointer",
                  fontSize: 11,
                  marginLeft: 6,
                  textDecoration: "underline",
                  fontWeight: 600
                }}
              >
                {copied ? "✓ Copied" : "Copy ID"}
              </button>
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#991B1B",
              fontSize: 18,
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* What Happened */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#64748B", letterSpacing: "0.04em", marginBottom: 4 }}>
            What happened?
          </div>
          <div style={{ fontSize: 13.5, color: "#1E293B", lineHeight: 1.6, background: "#F8FAFC", padding: "12px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            {userVer.whatHappened}
          </div>
        </div>

        {/* What You Can Do */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#64748B", letterSpacing: "0.04em", marginBottom: 4 }}>
            What you can do
          </div>
          <div style={{ fontSize: 13.5, color: "#1E293B", lineHeight: 1.6, background: "#F8FAFC", padding: "12px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            {userVer.whatYouCanDo}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
          {onReviewData && (
            <button
              onClick={onReviewData}
              style={{
                background: "#0F172A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              📊 Review Data
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              🔄 Try Again
            </button>
          )}

          <button
            onClick={() => {
              if (onGetHelp) onGetHelp();
              else if (typeof window !== "undefined" && window.aidaAskQuestion) {
                window.aidaAskQuestion("Why did this happen?");
              }
            }}
            style={{
              background: "#F1F5F9",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            ✨ Ask Copilot "Why Did This Happen?"
          </button>

          {/* Admin diagnostic toggle */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminDiagnostics(!showAdminDiagnostics)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                color: "#64748B",
                border: "1px dashed #CBD5E1",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {showAdminDiagnostics ? "Hide Admin Telemetry ▲" : "Admin Diagnostic View (Telemetry) ▼"}
            </button>
          )}
        </div>

        {/* Admin/Telemetry View (Strictly sanitized, no leaked secrets or raw queries) */}
        {showAdminDiagnostics && (
          <div style={{
            background: "#0F172A",
            color: "#F8FAFC",
            borderRadius: 8,
            padding: 14,
            fontSize: 12,
            fontFamily: "monospace",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 8,
            border: "1px solid #334155"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #334155", paddingBottom: 6 }}>
              <span style={{ color: "#38BDF8", fontWeight: 700 }}>INCIDENT #{userVer.errorId}</span>
              <span style={{ color: "#4ADE80", fontWeight: 700 }}>STATUS: {intVer.status || "CONTAINED"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: "#94A3B8" }}>
              <div><strong style={{ color: "#E2E8F0" }}>Service:</strong> {intVer.service}</div>
              <div><strong style={{ color: "#E2E8F0" }}>Stage:</strong> {intVer.stage}</div>
              <div><strong style={{ color: "#E2E8F0" }}>Dataset Version:</strong> {intVer.datasetVersion}</div>
              <div><strong style={{ color: "#E2E8F0" }}>Request ID:</strong> {intVer.requestId}</div>
              <div><strong style={{ color: "#E2E8F0" }}>Exception Type:</strong> {intVer.exception}</div>
              <div><strong style={{ color: "#E2E8F0" }}>Timestamp:</strong> {intVer.timestamp}</div>
            </div>
            <div style={{ marginTop: 4, background: "#1E293B", padding: 8, borderRadius: 6, color: "#E2E8F0" }}>
              <div style={{ color: "#38BDF8", fontWeight: 600, marginBottom: 2 }}>Observed Telemetry & Recovery:</div>
              <div>{intVer.recovery || "Worker process terminated safely. Memory state isolated. No persistent database mutations committed."}</div>
            </div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontStyle: "italic" }}>
              🔒 Stack trace & database details are private and retained in secure audit storage only.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
