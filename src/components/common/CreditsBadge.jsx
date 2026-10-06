// src/components/common/CreditsBadge.jsx
import React, { useState } from "react";
import { useCredits } from "../../utils/creditsManager";
import CreditsModal from "./CreditsModal";

export default function CreditsBadge({ variant = "compact", showModalOnClick = true, style = {} }) {
  const { credits, usedTokens, limit } = useCredits();
  const [modalOpen, setModalOpen] = useState(false);

  const isLow = credits <= 5;
  const isOut = credits === 0;

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          data-testid="credits-badge"
          onClick={() => showModalOnClick && setModalOpen(true)}
          title={`AI Credits: ${credits}/50 available (Click to view details)`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 8,
            background: isOut
              ? "rgba(239, 68, 68, 0.1)"
              : isLow
              ? "rgba(245, 158, 11, 0.12)"
              : "rgba(16, 185, 129, 0.08)",
            border: `1px solid ${
              isOut
                ? "rgba(239, 68, 68, 0.3)"
                : isLow
                ? "rgba(245, 158, 11, 0.35)"
                : "rgba(16, 185, 129, 0.25)"
            }`,
            color: isOut ? "#DC2626" : isLow ? "#D97706" : "#059669",
            fontSize: 12,
            fontWeight: 700,
            cursor: showModalOnClick ? "pointer" : "default",
            transition: "all 0.15s ease",
            ...style
          }}
        >
          <span style={{ fontSize: 13 }}>⚡</span>
          <span>{credits} Credits</span>
        </button>

        {showModalOnClick && (
          <CreditsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  // Card variant for sidebars or drawers
  return (
    <>
      <div
        data-testid="credits-card"
        style={{
          background: "linear-gradient(135deg, var(--bg-hover, #F8FAFC) 0%, var(--bg-primary, #F1F5F9) 100%)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: 10,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          ...style
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 12, color: "#F59E0B" }}>⚡</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
              AI Credits
            </span>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: isOut ? "#DC2626" : isLow ? "#D97706" : "#059669"
          }}>
            {credits} / 50 Left
          </span>
        </div>

        {/* Mini progress bar */}
        <div style={{
          height: 5,
          background: "var(--border-color, #E2E8F0)",
          borderRadius: 4,
          overflow: "hidden"
        }}>
          <div style={{
            width: `${Math.min(100, (usedTokens / limit) * 100)}%`,
            height: "100%",
            background: isOut ? "#EF4444" : "var(--brand-blue, #2563EB)",
            transition: "width 0.3s ease"
          }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <span style={{ fontSize: 9.5, color: "var(--text-muted, #64748B)" }}>
            50k rolling quota
          </span>
          {showModalOnClick && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-blue, #2563EB)",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0
              }}
            >
              Details ➔
            </button>
          )}
        </div>
      </div>

      {showModalOnClick && (
        <CreditsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
