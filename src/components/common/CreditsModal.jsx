// src/components/common/CreditsModal.jsx
import React from "react";
import { useCredits } from "../../utils/creditsManager";

export default function CreditsModal({ isOpen, onClose }) {
  const { credits, usedTokens, limit, resetTime, tier, reset } = useCredits();

  if (!isOpen) return null;

  const usedPercentage = Math.min(100, Math.round((usedTokens / limit) * 100));
  const remainingTokens = Math.max(0, limit - usedTokens);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--bg-secondary, #FFFFFF)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: 16,
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-sans, sans-serif)",
          animation: "fadeInScale 0.15s ease-out"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-color, #E2E8F0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, var(--bg-hover, #F8FAFC) 0%, var(--bg-secondary, #FFFFFF) 100%)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
                AI Credits & Token Quota
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary, #64748B)" }}>
                Workspace computing limits & real-time balance
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              color: "var(--text-muted, #94A3B8)",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Main Balance Hero Card */}
          <div style={{
            background: "linear-gradient(135deg, var(--bg-primary, #F8FAFC) 0%, var(--bg-hover, #F1F5F9) 100%)",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary, #64748B)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Available AI Credits
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: credits > 5 ? "var(--text-primary, #0F172A)" : "var(--danger, #EF4444)", fontFamily: "var(--font-heading)" }}>
                  {credits}
                </span>
                <span style={{ fontSize: 14, color: "var(--text-muted, #94A3B8)", fontWeight: 600 }}>
                  / 50 Credits
                </span>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: credits > 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                color: credits > 0 ? "#10B981" : "#EF4444",
                border: `1px solid ${credits > 0 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`
              }}>
                {credits > 0 ? "● Active & Ready" : "○ Quota Depleted"}
              </span>
              <div style={{ fontSize: 10.5, color: "var(--text-secondary, #64748B)", marginTop: 4 }}>
                Tier: <strong style={{ color: "var(--text-primary, #0F172A)", textTransform: "capitalize" }}>{tier || "Pro"}</strong>
              </div>
            </div>
          </div>

          {/* Token Usage Meter */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary, #0F172A)" }}>
                Rolling Token Consumption
              </span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11.5, color: "var(--text-secondary, #64748B)" }}>
                {usedTokens.toLocaleString()} / {limit.toLocaleString()} tokens ({usedPercentage}%)
              </span>
            </div>
            
            <div style={{
              height: 8,
              background: "var(--border-color, #E2E8F0)",
              borderRadius: 6,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${usedPercentage}%`,
                height: "100%",
                background: usedPercentage >= 90 ? "var(--danger, #EF4444)" : "linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)",
                borderRadius: 6,
                transition: "width 0.3s ease"
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--text-muted, #94A3B8)", marginTop: 4 }}>
              <span>{remainingTokens.toLocaleString()} tokens remaining</span>
              <span>1 credit ≈ 500 tokens</span>
            </div>
          </div>

          {/* Reset Information Box */}
          <div style={{
            background: "rgba(37, 99, 235, 0.05)",
            border: "1px solid rgba(37, 99, 235, 0.15)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 11.5,
            color: "var(--text-secondary, #334155)",
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 700, color: "#1E40AF", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span>ℹ️</span> <span>How Credits & Quota Work</span>
            </div>
            <div>
              Every question asked, chart created, or machine learning model generated consumes <strong>1 credit</strong>. Your quota includes 50 credits per 5-hour rolling window.
            </div>
            {resetTime && (
              <div style={{ marginTop: 6, color: "#B45309", fontWeight: 600 }}>
                ⏳ Auto-refreshes at {new Date(resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--border-color, #E2E8F0)",
          background: "var(--bg-primary, #F8FAFC)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <button
            onClick={() => {
              reset();
            }}
            title="Instant Refill to 50 Credits"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#059669",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🔄</span> <span>Instant Refill (50 Credits)</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: "var(--accent-color, #0F172A)",
              color: "#FFF",
              border: "none",
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
