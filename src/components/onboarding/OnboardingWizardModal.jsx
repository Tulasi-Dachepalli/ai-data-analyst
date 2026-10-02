// src/components/onboarding/OnboardingWizardModal.jsx
import React, { useState } from "react";
import { useRole } from "../../context/RoleContext";
import { useActivity } from "../../context/ActivityContext";

export default function OnboardingWizardModal({ isOpen, onClose, onUploadClick, onGoogleSheetsClick, onExploreDemoClick }) {
  const { user, roleConfig, setRole } = useRole();
  const { logEvent } = useActivity();
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const displayName = user?.fullName || (user?.email ? user.email.split("@")[0].replace(/[._]/g, " ") : "Tulasi");

  const steps = [
    {
      num: 1,
      badge: "Step 1 of 3 • Role Scope",
      title: `Welcome, ${displayName}!`,
      subtitle: "Choose your perspective to tailor dashboards, KPI priorities, and reports."
    },
    {
      num: 2,
      badge: "Step 2 of 3 • Add Data",
      title: "Bring Your Business Data",
      subtitle: "Upload CSV, Excel, or connect Google Sheets. Raw data is immutable."
    },
    {
      num: 3,
      badge: "Step 3 of 3 • Power BI & AI",
      title: "Interactive Dashboards & Copilot",
      subtitle: "Ask questions in plain English, cross-filter visuals, and export executive reports."
    }
  ];

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("aida_onboarding_dismissed", "true");
      } catch (e) {}
    }
    logEvent({
      stage: "01 Raw Data",
      action: "Completed Interactive AI Guide",
      result: `Workspace configured for ${roleConfig?.title || "Executive"} (${displayName})`
    });
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
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
      justifyContent: "center",
      padding: 12
    }}>
      <div style={{
        width: 520,
        maxWidth: "94vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.3)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #CBD5E1",
        animation: "modalFadeIn 0.2s ease-out"
      }}>
        {/* Compact Header */}
        <div style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative"
        }}>
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              fontSize: 10.5,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 12,
              textTransform: "uppercase"
            }}>
              ✨ AI Business Copilot Guide
            </div>
            <h2 style={{
              fontSize: 17,
              fontWeight: 800,
              margin: "6px 0 2px 0",
              letterSpacing: "-0.01em"
            }}>
              {steps[currentStep - 1].title}
            </h2>
            <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>
              {steps[currentStep - 1].subtitle}
            </div>
          </div>

          <button
            onClick={handleFinish}
            title="Close Guide"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "#FFF",
              width: 26,
              height: 26,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ background: "#E2E8F0", height: 3, width: "100%" }}>
          <div style={{
            background: "linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)",
            height: "100%",
            width: `${(currentStep / 3) * 100}%`,
            transition: "width 0.25s ease"
          }} />
        </div>

        {/* Compact Body Content */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          
          {/* STEP 1: Compact Role Selection */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Select Your Perspective:
                </span>
                <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, background: "#F0FDF4", padding: "1px 6px", borderRadius: 8 }}>
                  ● Active Workspace
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { id: "ceo", icon: "👔", label: "CEO / Executive", desc: "KPI Briefs, Revenue Trends, Risk Signals" },
                  { id: "data_analyst", icon: "📊", label: "Data Analyst", desc: "Data Profiling, Quality Scores, Schema" },
                  { id: "finance", icon: "💰", label: "Finance Director", desc: "Budget Variance, Expense Outliers" },
                  { id: "data_scientist", icon: "🧪", label: "Data Scientist", desc: "Automated ML Models & Forecasting" }
                ].map(r => {
                  const isSelected = roleConfig?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        border: isSelected ? "2px solid #2563EB" : "1px solid #E2E8F0",
                        background: isSelected ? "#EFF6FF" : "#FFFFFF",
                        padding: "10px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 15 }}>{r.icon}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? "#1E40AF" : "#0F172A" }}>
                          {r.label}
                        </span>
                        {isSelected && <span style={{ marginLeft: "auto", color: "#2563EB", fontWeight: 800, fontSize: 12 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748B", lineHeight: 1.3 }}>{r.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Compact Data Ingestion */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                background: "#F8FAFC",
                border: "1.5px dashed #CBD5E1",
                borderRadius: 10,
                padding: "16px 14px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                  Upload Business Data
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", margin: "4px auto 12px auto" }}>
                  Supports CSV, Excel (.xlsx, .xls), JSON. Raw data is stored immutable as v1.
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      onClose();
                      if (onUploadClick) onUploadClick();
                    }}
                    style={{
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    + Upload File Now
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onGoogleSheetsClick) onGoogleSheetsClick();
                    }}
                    style={{
                      background: "#FFFFFF",
                      color: "#0F172A",
                      border: "1px solid #CBD5E1",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    🔗 Google Sheets
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onExploreDemoClick) onExploreDemoClick();
                    }}
                    style={{
                      background: "none",
                      color: "#64748B",
                      border: "1px dashed #CBD5E1",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    🧪 Explore Demo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Compact Power BI & Reports Overview */}
          {currentStep === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>
                  📊 Power BI Visuals & Slicers
                </div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.3 }}>
                  Global dropdown slicers cross-filter KPI cards, charts, and maps synchronously.
                </div>
              </div>

              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>
                  📑 1-Click Reports & PC Save
                </div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.3 }}>
                  Instant executive report download directly to your PC and automated email dispatch.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div style={{
          padding: "12px 20px",
          background: "#F8FAFC",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#64748B", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>Don't show on launch</span>
          </label>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                style={{
                  background: "transparent",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: 7,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Back
              </button>
            )}

            {currentStep === 1 && (
              <button
                onClick={handleFinish}
                style={{
                  background: "transparent",
                  color: "#2563EB",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "6px 8px"
                }}
              >
                Skip ➔
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Next Step →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Start Analyzing ➔
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
