// src/components/copilot/CopilotPromptChips.jsx
import React from "react";
import { getCopilotPrompts } from "../../config/copilotPrompts";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";

export default function CopilotPromptChips({ onSelectPrompt }) {
  const { activeRole } = useRole();
  const { currentStage } = useDataset();

  const promptChips = getCopilotPrompts(activeRole, currentStage);

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
      {promptChips.map((q, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectPrompt(q)}
          style={{
            background: "rgba(241, 245, 249, 0.8)",
            border: "1px solid var(--border-color, #CBD5E1)",
            borderRadius: 14,
            padding: "5px 12px",
            fontSize: 11.5,
            fontWeight: 600,
            color: "var(--text-primary, #0F172A)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.background = "#FFFFFF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color, #CBD5E1)"; e.currentTarget.style.background = "rgba(241, 245, 249, 0.8)"; }}
        >
          💡 {q}
        </button>
      ))}
    </div>
  );
}
