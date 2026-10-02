// src/components/layout/ContextualIntelligenceRail.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";
import { useRole } from "../../context/RoleContext";

export default function ContextualIntelligenceRail() {
  const { currentStage, currentVersion, activeDataset, openInvestigation } = useDataset();
  const { roleConfig } = useRole();
  const { askQuestion } = useCopilot();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    if (askQuestion) askQuestion(input);
    setInput("");
  };

  return (
    <aside style={{
      width: 280,
      background: "var(--bg-secondary, #FFFFFF)",
      borderLeft: "1px solid var(--border-color, #E2E8F0)",
      height: "calc(100vh - 56px)",
      position: "fixed",
      top: 56,
      right: 0,
      zIndex: 70,
      display: "flex",
      flexDirection: "column",
      padding: 16,
      gap: 14,
      overflowY: "auto",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #E2E8F0", paddingBottom: 10 }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800
        }}>
          🤖
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>Contextual Copilot Rail</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>Grounded Stage Awareness</div>
        </div>
      </div>

      {/* Active Stage & Grounding Pills */}
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Current Stage</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB" }}>
          Stage: {currentStage.toUpperCase()}
        </div>
        <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>
          Dataset: <strong>{activeDataset?.name || "Audit Ops"}</strong> ({currentVersion?.version || "v4"})
        </div>
      </div>

      {/* Grounded Findings Summary */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0F172A", marginBottom: 8, textTransform: "uppercase" }}>
          💡 Active Stage Findings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#334155" }}>
          <div style={{ background: "#F0FDF4", padding: 8, borderRadius: 6, borderLeft: "3px solid #16A34A" }}>
            • Revenue trend ↑ +8.4% growth
          </div>
          <div style={{ background: "#FEF2F2", padding: 8, borderRadius: 6, borderLeft: "3px solid #DC2626" }}>
            • 27 structural anomalies detected
          </div>
          <div style={{ background: "#EFF6FF", padding: 8, borderRadius: 6, borderLeft: "3px solid #2563EB" }}>
            • 24 duplicate records removed in v2
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={() => openInvestigation({
          title: `Contextual Rail Evidence: ${currentStage.toUpperCase()}`,
          question: `Summarize evidence for stage ${currentStage.toUpperCase()}`,
          affectedRows: 12482,
          findings: ["Calculated from active dataset version stack."]
        })}
        style={{
          background: "#0F172A",
          color: "#FFF",
          border: "none",
          borderRadius: 8,
          padding: "8px",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          marginTop: 4
        }}
      >
        🔬 Inspect Stage Evidence
      </button>

      {/* Quick Copilot Query Box */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Ask Copilot about this view..."
          style={{
            width: "100%",
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box"
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            background: !input.trim() ? "#CBD5E1" : "#2563EB",
            color: "#FFF",
            border: "none",
            borderRadius: 8,
            padding: "7px",
            fontSize: 12,
            fontWeight: 700,
            cursor: !input.trim() ? "default" : "pointer"
          }}
        >
          Ask Copilot ↑
        </button>
      </div>
    </aside>
  );
}
