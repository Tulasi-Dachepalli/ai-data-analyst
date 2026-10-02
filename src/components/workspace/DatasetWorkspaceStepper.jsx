// src/components/workspace/DatasetWorkspaceStepper.jsx
import React from "react";
import { getVisibleStagesForRole, getStageLockState } from "../../config/workflowStages";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";

export default function DatasetWorkspaceStepper() {
  const { activeRole } = useRole();
  const { currentStage, setCurrentStage, currentVersion, activeRows, history } = useDataset();
  const stages = getVisibleStagesForRole(activeRole);

  const completedStages = ["raw", "quality"];
  const stageObj = stages.find(s => s.id === currentStage) || stages[0];

  return (
    <div style={{
      background: "var(--bg-secondary, #FFFFFF)",
      border: "1px solid var(--border-color, #E2E8F0)",
      borderRadius: 14,
      padding: "12px 16px",
      marginBottom: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      {/* 9-Stage Progress Stepper Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto" }}>
        {stages.map((st, idx) => {
          const lockState = getStageLockState(st.id, currentStage, completedStages, activeRole);
          const isCurrent = lockState === "current";
          const isCompleted = lockState === "completed";
          const isLocked = lockState === "locked";
          const isRestricted = lockState === "restricted";

          return (
            <React.Fragment key={st.id}>
              <button
                type="button"
                disabled={isLocked || isRestricted}
                onClick={() => !isLocked && !isRestricted && setCurrentStage(st.id)}
                title={isRestricted ? "Restricted by Role Permissions" : isLocked ? "Prerequisites Not Completed" : st.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isCurrent
                    ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
                    : isCompleted
                    ? "rgba(16, 185, 129, 0.08)"
                    : isRestricted
                    ? "rgba(239, 68, 68, 0.05)"
                    : isLocked
                    ? "var(--bg-primary, #F8FAFC)"
                    : "var(--bg-secondary, #FFFFFF)",
                  border: isCurrent
                    ? "1px solid #0F172A"
                    : isCompleted
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : isRestricted
                    ? "1px solid rgba(239, 68, 68, 0.2)"
                    : isLocked
                    ? "1px solid var(--border-color, #E2E8F0)"
                    : "1px solid var(--border-color, #CBD5E1)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? "#FFFFFF" : isCompleted ? "#059669" : isRestricted ? "#EF4444" : isLocked ? "#94A3B8" : "var(--text-primary, #475569)",
                  cursor: (isLocked || isRestricted) ? "not-allowed" : "pointer",
                  opacity: (isLocked || isRestricted) ? 0.6 : 1,
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isCurrent ? "#FFF" : isCompleted ? "#10B981" : isRestricted ? "#EF4444" : isLocked ? "#94A3B8" : "#2563EB"
                }}>
                  {isCompleted ? "✓" : isCurrent ? "● CURRENT" : isRestricted ? "⛔ RESTRICTED" : isLocked ? "🔒 LOCKED" : "○ AVAILABLE"}
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

      {/* Sub-header Breadcrumb Context Banner */}
      <div style={{
        background: "var(--bg-primary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--text-secondary, #64748B)",
        display: "flex",
        justify: "space-between",
        alignItems: "center"
      }}>
        <div>
          <strong style={{ color: "var(--text-primary, #0F172A)" }}>You are here:</strong> Stage {stageObj?.number || "03"} {stageObj?.label || "Data Cleaning"}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span>{Math.max(1, history.length - 1)} transformations completed</span>
          <span>•</span>
          <span>{activeRows.length.toLocaleString()} rows affected</span>
          <span>•</span>
          <span style={{ color: "#2563EB", fontWeight: 700 }}>Dataset {currentVersion?.version || "v4"}</span>
        </div>
      </div>
    </div>
  );
}
