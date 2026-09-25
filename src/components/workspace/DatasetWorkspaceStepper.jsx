// src/components/workspace/DatasetWorkspaceStepper.jsx
import React from "react";
import { getVisibleStagesForRole } from "../../config/workflowStages";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";

export default function DatasetWorkspaceStepper() {
  const { activeRole } = useRole();
  const { currentStage, setCurrentStage } = useDataset();
  const stages = getVisibleStagesForRole(activeRole);

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
          const isActive = currentStage === st.id;
          const isPast = stages.findIndex(s => s.id === currentStage) > idx;

          return (
            <React.Fragment key={st.id}>
              <button
                type="button"
                onClick={() => setCurrentStage(st.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isActive
                    ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
                    : isPast
                    ? "rgba(16, 185, 129, 0.08)"
                    : "var(--bg-primary, #F8FAFC)",
                  border: isActive
                    ? "1px solid #0F172A"
                    : isPast
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid var(--border-color, #E2E8F0)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#FFFFFF" : isPast ? "#059669" : "var(--text-primary, #475569)",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: isActive ? "rgba(255,255,255,0.2)" : isPast ? "#10B981" : "#94A3B8",
                  color: isActive ? "#FFF" : isPast ? "#FFF" : "#FFF",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justify: "center"
                }}>
                  {st.number}
                </span>
                <span>{st.label}</span>
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
