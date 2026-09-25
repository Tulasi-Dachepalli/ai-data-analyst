// src/components/workspace/DatasetWorkspaceStepper.jsx
import React from "react";
import { getVisibleStagesForRole, getStageLockState } from "../../config/workflowStages";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";

export default function DatasetWorkspaceStepper() {
  const { activeRole } = useRole();
  const { currentStage, setCurrentStage } = useDataset();
  const stages = getVisibleStagesForRole(activeRole);

  const completedStages = ["raw", "quality"]; // Mocked completed stages sequence

  return (
    <div style={{
      background: "var(--bg-secondary, #FFFFFF)",
      border: "1px solid var(--border-color, #E2E8F0)",
      borderRadius: 14,
      padding: "10px 16px",
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      overflowX: "auto"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: "max-content" }}>
        {stages.map((st, idx) => {
          const lockState = getStageLockState(st.id, currentStage, completedStages);
          const isCurrent = lockState === "current";
          const isCompleted = lockState === "completed";
          const isLocked = lockState === "locked";

          return (
            <React.Fragment key={st.id}>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && setCurrentStage(st.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isCurrent
                    ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
                    : isCompleted
                    ? "rgba(16, 185, 129, 0.08)"
                    : isLocked
                    ? "var(--bg-primary, #F8FAFC)"
                    : "var(--bg-secondary, #FFFFFF)",
                  border: isCurrent
                    ? "1px solid #0F172A"
                    : isCompleted
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : isLocked
                    ? "1px solid var(--border-color, #E2E8F0)"
                    : "1px solid var(--border-color, #CBD5E1)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? "#FFFFFF" : isCompleted ? "#059669" : isLocked ? "#94A3B8" : "var(--text-primary, #475569)",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  opacity: isLocked ? 0.6 : 1,
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isCurrent ? "#FFF" : isCompleted ? "#10B981" : isLocked ? "#94A3B8" : "#2563EB"
                }}>
                  {isCompleted ? "✓" : isCurrent ? "●" : isLocked ? "🔒" : "○"}
                </span>
                <span>{st.number}. {st.label}</span>
              </button>

              {idx < stages.length - 1 && (
                <span style={{ fontSize: 12, color: "#CBD5E1", fontWeight: 700 }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
