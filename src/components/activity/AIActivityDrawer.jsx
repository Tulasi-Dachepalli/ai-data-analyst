// src/components/activity/AIActivityDrawer.jsx
import React, { useState } from "react";
import { useActivity } from "../../context/ActivityContext";
import { useDataset } from "../../context/DatasetContext";

export default function AIActivityDrawer() {
  const { drawerOpen, closeActivityDrawer, events, isProcessing } = useActivity();
  const { activeDataset, currentVersion, openInvestigation } = useDataset();
  const [filter, setFilter] = useState("all"); // all, transformations, scans

  if (!drawerOpen) return null;

  const datasetName = activeDataset?.name || "No Dataset Loaded";
  const versionTag = currentVersion?.version || activeDataset?.currentVersion || "v1";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(3px)",
      zIndex: 999,
      display: "flex",
      justifyContent: "flex-end"
    }}>
      <div style={{
        width: 480,
        maxWidth: "90vw",
        height: "100%",
        backgroundColor: "#FFFFFF",
        boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto"
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: "20px 24px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🤖 Global AI Activity & Process Log
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              AI Event Trail
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
              Dataset: {datasetName} • Version: {versionTag}
            </div>
          </div>
          <button
            onClick={closeActivityDrawer}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#FFF",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", gap: 8 }}>
          {[
            { id: "all", label: `All Events (${events.length})` },
            { id: "transformations", label: "Transformations" },
            { id: "scans", label: "Quality Scans" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                border: "none",
                fontSize: 11.5,
                fontWeight: 700,
                background: filter === f.id ? "#0F172A" : "#E2E8F0",
                color: filter === f.id ? "#FFFFFF" : "#475569",
                cursor: "pointer"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event Stream List */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {isProcessing && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1E4ED8" }}>AI engine currently executing stage pipeline step...</span>
            </div>
          )}

          {events.map(evt => (
            <div key={evt.id} style={{
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 14,
              background: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 6 }}>
                  {evt.stage}
                </span>
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{evt.timestamp}</span>
              </div>

              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>
                ✓ {evt.action}
              </div>

              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>
                {evt.result}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid #F1F5F9", fontSize: 11.5, color: "#64748B" }}>
                <span>Version: <strong style={{ color: "#0F172A" }}>{evt.datasetVersion}</strong> • {evt.affectedRows} rows affected</span>
                <button
                  onClick={() => openInvestigation({
                    title: `AI Event: ${evt.action}`,
                    question: `Why did the AI execute: ${evt.action}?`,
                    affectedRows: evt.affectedRows,
                    findings: [evt.result, `Stage: ${evt.stage}`, `Version: ${evt.datasetVersion}`]
                  })}
                  style={{ background: "#F1F5F9", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#0F172A", cursor: "pointer" }}
                >
                  Inspect Event →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
