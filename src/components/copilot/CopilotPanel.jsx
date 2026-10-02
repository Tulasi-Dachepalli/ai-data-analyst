// src/components/copilot/CopilotPanel.jsx
import React, { useState } from "react";
import CopilotPromptChips from "./CopilotPromptChips";
import GroundingBadge from "./GroundingBadge";
import { useDataset } from "../../context/DatasetContext";
import { useRole } from "../../context/RoleContext";
import { useCopilot } from "../../context/CopilotContext";

export default function CopilotPanel({ onAskQuestion }) {
  const { roleConfig } = useRole();
  const { currentVersion, currentStage, activeRows, openInvestigation } = useDataset();
  const { messages, loading, loadingLabel, askQuestion } = useCopilot();
  const [input, setInput] = useState("");
  const [primaryMode, setPrimaryMode] = useState("ask"); // ask, investigate, act

  const handleSend = (overrideQuery) => {
    const q = overrideQuery || input;
    if (!q || !q.trim()) return;
    setInput("");

    let prefix = "";
    if (primaryMode === "investigate") prefix = "Investigate Root Cause: ";
    if (primaryMode === "act") prefix = "Action Operation Request: ";

    const fullQuery = prefix + q;

    if (onAskQuestion) {
      onAskQuestion(fullQuery);
    } else if (askQuestion) {
      askQuestion(fullQuery);
    }
  };

  return (
    <div style={{
      background: "var(--bg-secondary, #FFFFFF)",
      border: "1px solid var(--border-color, #E2E8F0)",
      borderRadius: 16,
      padding: 18,
      boxShadow: "0 4px 20px rgba(15,23,42,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }}>
      {/* Copilot Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #E2E8F0)", paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFF",
            display: "flex",
            alignItems: "center",
            justify: "center",
            fontSize: 16,
            fontWeight: 800
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              {roleConfig?.shortName || "Executive"} AI Science Copilot
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary, #64748B)" }}>
              Context: {currentVersion?.version || "v1"} • Stage: {currentStage.toUpperCase()}
            </div>
          </div>
        </div>

        <GroundingBadge type="dataset" version={currentVersion?.version || "v1"} records={activeRows.length} />
      </div>

      {/* 3 Primary Copilot Modes */}
      <div style={{ display: "flex", gap: 6, background: "#F1F5F9", padding: 4, borderRadius: 10 }}>
        {[
          { id: "ask", label: "💬 Ask (Questions)", desc: "General queries" },
          { id: "investigate", label: "🔍 Investigate (Evidence)", desc: "Root cause analysis" },
          { id: "act", label: "⚡ Act (Operations)", desc: "Controlled data changes" }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setPrimaryMode(m.id)}
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: 8,
              border: "none",
              fontSize: 11.5,
              fontWeight: 700,
              background: primaryMode === m.id ? "#0F172A" : "transparent",
              color: primaryMode === m.id ? "#FFFFFF" : "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Stage-Aware Prompt Chips */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
            Suggested Stage Queries
          </div>
          <button
            onClick={() => handleSend("Why did this happen?")}
            style={{
              background: "none",
              border: "none",
              color: "#2563EB",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: "0 2px",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
            title="Truthfully explain recent error or operation status from verified telemetry"
          >
            🔍 Why did this happen?
          </button>
        </div>
        <CopilotPromptChips onSelectPrompt={(q) => handleSend(q)} />
      </div>

      {/* Message Feed Stream */}
      <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
        {messages.length === 0 ? (
          <div style={{
            background: "#F8FAFC",
            border: "1px dashed #CBD5E1",
            borderRadius: 12,
            padding: 16,
            textAlign: "center"
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
              Active Mode: {primaryMode.toUpperCase()}
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B" }}>
              {primaryMode === "ask" && "Ask anything about dataset metrics, trends, or forecasts."}
              {primaryMode === "investigate" && "Deep-dive into evidence tables, root causes, and anomalies."}
              {primaryMode === "act" && "Execute confirmed data cleaning operations and deck generation."}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#0F172A" : "#F8FAFC",
              color: m.role === "user" ? "#FFFFFF" : "#0F172A",
              border: m.role === "user" ? "none" : "1px solid #E2E8F0",
              borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              padding: 12,
              fontSize: 12.5,
              maxWidth: "90%",
              lineHeight: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              {m.role !== "user" && (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>✓ Grounded on Dataset {currentVersion?.version || "v1"}</span>
                </div>
              )}

              <div>{m.content}</div>

              {m.role !== "user" && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => openInvestigation({
                      title: "Copilot Response Evidence",
                      question: m.content.slice(0, 60) + "...",
                      affectedRows: activeRows.length,
                      findings: [m.content]
                    })}
                    style={{
                      background: "#0F172A",
                      color: "#FFF",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🔬 Inspect Evidence
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={{ fontSize: 11.5, color: "#64748B", fontStyle: "italic", padding: "4px 8px" }}>
            ⚡ {loadingLabel}
          </div>
        )}
      </div>

      {/* Input Control Box */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder={`[${primaryMode.toUpperCase()} MODE] Ask grounded question...`}
          style={{
            flex: 1,
            border: "1px solid var(--border-color, #CBD5E1)",
            borderRadius: 20,
            padding: "8px 14px",
            fontSize: 13,
            outline: "none",
            background: "var(--bg-primary, #F8FAFC)",
            color: "var(--text-primary, #0F172A)"
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            background: !input.trim() ? "#CBD5E1" : "#2563EB",
            color: "#FFF",
            cursor: !input.trim() ? "default" : "pointer",
            fontWeight: 800,
            fontSize: 14
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
