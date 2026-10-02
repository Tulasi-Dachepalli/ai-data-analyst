// src/components/onboarding/OnboardingWizardModal.jsx
import React, { useState } from "react";
import { useRole } from "../../context/RoleContext";
import { useActivity } from "../../context/ActivityContext";

export default function OnboardingWizardModal({ isOpen, onClose }) {
  const { roleConfig, setRole } = useRole();
  const { logEvent } = useActivity();
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    { num: 1, title: "Choose Your Executive Role", subtitle: "Select your role to tailor KPI cards, AI briefs, and RBAC permissions." },
    { num: 2, title: "Upload & Profile Dataset", subtitle: "Upload CSV, XLSX, or JSON files. Immutable Raw Dataset v1 is created." },
    { num: 3, title: "Automated Quality & Anomaly Assessment", subtitle: "AI performs schema scanning, duplicate detection, and missing value analysis." },
    { num: 4, title: "Review Traceable Transformations", subtitle: "Review before/after diffs and confirm AI cleaning recommendations." },
    { num: 5, title: "Explore & Forecast with Copilot", subtitle: "Ask grounded questions, run AutoML models, and export executive deck reports." }
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      logEvent({
        stage: "01 Raw Data",
        action: "Completed Workspace Onboarding Wizard",
        result: `Workspace configured for ${roleConfig?.title || "Executive"}`
      });
      onClose();
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justify: "center",
      padding: 20
    }}>
      <div style={{
        width: 600,
        maxWidth: "95vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 25px 50px rgba(15, 23, 42, 0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          display: "flex",
          justify: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Welcome to AI Business & Science Copilot
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              Workspace Setup & Onboarding ({currentStep}/5)
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Progress Bar */}
        <div style={{ background: "#E2E8F0", height: 4, width: "100%" }}>
          <div style={{
            background: "linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)",
            height: "100%",
            width: `${(currentStep / 5) * 100}%`,
            transition: "width 0.3s ease"
          }} />
        </div>

        {/* Body Content */}
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Step {currentStep}: {steps[currentStep - 1].title}
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
              {steps[currentStep - 1].subtitle}
            </div>
          </div>

          {currentStep === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { id: "ceo", label: "👔 CEO / Executive", desc: "KPI Briefs, Revenue Trends" },
                { id: "data_analyst", label: "📊 Data Analyst", desc: "Data Quality, Profiling" },
                { id: "finance", label: "💰 Finance", desc: "Budget Variance, Overspending" },
                { id: "data_scientist", label: "🧪 Data Scientist", desc: "AutoML, Forecasting" }
              ].map(r => (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  style={{
                    border: roleConfig?.id === r.id ? "2px solid #2563EB" : "1px solid #E2E8F0",
                    background: roleConfig?.id === r.id ? "#EFF6FF" : "#F8FAFC",
                    padding: 14,
                    borderRadius: 10,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: roleConfig?.id === r.id ? "#2563EB" : "#0F172A" }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 12, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Drag & drop sample dataset or click Browse</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Supported: CSV, XLSX, XLS, JSON, Parquet, TXT</div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#166534" }}>✓ Automated Quality Scan Engine Ready</div>
              <div style={{ fontSize: 12, color: "#15803D", marginTop: 4 }}>
                Calculates health scores (e.g. 94/100), detects duplicate row hashes, missing values, and date string formats.
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1E4ED8" }}>📜 Lineage Version Guarantee</div>
              <div style={{ fontSize: 12, color: "#1E3A8A", marginTop: 4 }}>
                Raw uploaded data remains locked as v1. All cleaning transformations produce traceable versions (v2, v3, v4).
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🤖</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>You're all set!</div>
              <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                Use Copilot in Ask, Investigate, or Act mode anytime in your workspace.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px",
          borderTop: "1px solid #E2E8F0",
          backgroundColor: "#F8FAFC",
          display: "flex",
          justify: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>
            Workspace Setup {(currentStep / 5) * 100}% Complete
          </span>
          <button
            onClick={handleNext}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {currentStep < 5 ? "Next Step →" : "Get Started Now →"}
          </button>
        </div>
      </div>
    </div>
  );
}
