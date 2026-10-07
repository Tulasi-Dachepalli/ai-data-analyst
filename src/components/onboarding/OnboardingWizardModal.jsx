// src/components/onboarding/OnboardingWizardModal.jsx
import React, { useState, useEffect } from "react";
import { useRole } from "../../context/RoleContext";
import { useActivity } from "../../context/ActivityContext";

export default function OnboardingWizardModal({ isOpen, onClose, onUploadClick, onGoogleSheetsClick, onExploreDemoClick }) {
  const { user, roleConfig, setRole } = useRole();
  const activity = useActivity();
  const logEvent = activity?.logEvent;
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [showMoreRoles, setShowMoreRoles] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsTransitioning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = user?.fullName || (user?.email ? user.email.split("@")[0].replace(/[._]/g, " ") : "Tulasi");

  const primaryRoles = [
    { id: "ceo", icon: "👔", label: "CEO / Executive", desc: "KPI • Risk • ROI" },
    { id: "data_analyst", icon: "📊", label: "Data Analyst", desc: "Data • Quality • Schema" },
    { id: "finance", icon: "💰", label: "Finance", desc: "Budget • Variance • Cost" },
    { id: "data_scientist", icon: "🧪", label: "Data Scientist", desc: "ML • Forecasting • Models" }
  ];

  const additionalRoles = [
    { id: "hr", icon: "👥", label: "HR Executive", desc: "People • Retention • Turnover" },
    { id: "recruiter", icon: "🎯", label: "Recruiter", desc: "Talent • Pipeline • Funnel" }
  ];

  const handleFinish = (isSkipped = false) => {
    try {
      if (dontShowAgain) {
        localStorage.setItem("aida_onboarding_dismissed", "true");
      }
    } catch (e) {
      console.warn("Storage error saving onboarding dismissal:", e);
    }

    try {
      if (typeof logEvent === "function") {
        logEvent({
          stage: "01 Raw Data",
          action: isSkipped ? "Onboarding skipped" : "Completed Interactive AI Guide",
          result: isSkipped
            ? `User skipped onboarding guide to enter workspace directly`
            : `Workspace configured for ${roleConfig?.title || "Executive"} (${displayName})`
        });
      }
    } catch (e) {
      console.warn("Activity log error:", e);
    }

    setIsTransitioning(false);
    setCurrentStep(1);

    if (typeof onClose === "function") {
      try {
        onClose();
      } catch (err) {
        console.error("Error closing onboarding modal:", err);
      }
    }
  };

  const handleStartAnalyzing = () => {
    setIsTransitioning(true);
    // Auto-complete cleanly after 250ms or instantly if user clicks button
    setTimeout(() => {
      handleFinish();
    }, 250);
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleFinish(true);
        }
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.68)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12
      }}
    >
      <div style={{
        width: 520,
        maxWidth: "94vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #CBD5E1",
        animation: "modalFadeIn 0.2s ease-out"
      }}>
        {/* Compact Brand Header */}
        <div style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
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
              ✨ AI Business Copilot
            </div>
            <h2 style={{
              fontSize: 17,
              fontWeight: 800,
              margin: "6px 0 2px 0",
              letterSpacing: "-0.01em"
            }}>
              👋 Welcome, {displayName}!
            </h2>
            <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
              One AI. Every Business Role.
            </div>
          </div>

          <button
            onClick={() => handleFinish(true)}
            title="Close Guide & Enter Workspace"
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

        {/* Progress Stepper Bar */}
        <div style={{ background: "#E2E8F0", height: 3, width: "100%" }}>
          <div style={{
            background: "linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)",
            height: "100%",
            width: `${(currentStep / 3) * 100}%`,
            transition: "width 0.25s ease"
          }} />
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* STEP 1: Choose Your Perspective (6-Role RBAC) */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  STEP 1 • Choose your perspective:
                </span>
                <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, background: "#F0FDF4", padding: "1px 6px", borderRadius: 8 }}>
                  Role: {roleConfig?.title || "Executive"}
                </span>
              </div>

              {/* Primary 4 Roles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {primaryRoles.map(r => {
                  const isSelected = roleConfig?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        border: isSelected ? "2px solid #2563EB" : "1px solid #E2E8F0",
                        background: isSelected ? "#EFF6FF" : "#FFFFFF",
                        padding: "9px 12px",
                        borderRadius: 10,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 15 }}>{r.icon}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? "#1E40AF" : "#0F172A" }}>
                          {r.label}
                        </span>
                        {isSelected && <span style={{ marginLeft: "auto", color: "#2563EB", fontWeight: 800, fontSize: 12 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>{r.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* More Roles Toggle (HR & Recruiter) */}
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setShowMoreRoles(!showMoreRoles)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563EB",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "4px 8px"
                  }}
                >
                  {showMoreRoles ? "▲ Less roles" : "More roles ▾ (HR • Recruiter)"}
                </button>

                {showMoreRoles && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, animation: "modalFadeIn 0.15s ease-out" }}>
                    {additionalRoles.map(r => {
                      const isSelected = roleConfig?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          style={{
                            border: isSelected ? "2px solid #2563EB" : "1px solid #E2E8F0",
                            background: isSelected ? "#EFF6FF" : "#FFFFFF",
                            padding: "9px 12px",
                            borderRadius: 10,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 15 }}>{r.icon}</span>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? "#1E40AF" : "#0F172A" }}>
                              {r.label}
                            </span>
                            {isSelected && <span style={{ marginLeft: "auto", color: "#2563EB", fontWeight: 800, fontSize: 12 }}>✓</span>}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>{r.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Add Your Business Data */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                STEP 2 • Add your business data:
              </div>
              <div style={{
                background: "#F8FAFC",
                border: "1.5px dashed #CBD5E1",
                borderRadius: 10,
                padding: "16px 14px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📁</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                  Bring Real Tabular Records
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", margin: "4px auto 12px auto" }}>
                  Upload CSV, Excel, or connect Google Sheets. Raw records are immutably preserved.
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleFinish();
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
                    type="button"
                    onClick={() => {
                      handleFinish();
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
                    type="button"
                    onClick={() => {
                      handleFinish();
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

          {/* STEP 3: Preview & Automation (Always Ready & Enter Immediately) */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                STEP 3 • Preview & Automation:
              </div>

              <div style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚡</span> Workspace Ready for {roleConfig?.title || "Executive"}
                </div>
                <div style={{ fontSize: 11.5, color: "#16A34A", display: "flex", flexDirection: "column", gap: 4, fontFamily: "monospace" }}>
                  <div>✓ Role perspective initialized: {roleConfig?.title || "Executive"}</div>
                  <div>✓ Security and RBAC policies verified</div>
                  <div>✓ Power BI-style dashboard engine loaded</div>
                  <div>✓ Copilot grounding ready</div>
                </div>
                <div style={{ fontSize: 11.5, color: isTransitioning ? "#2563EB" : "#64748B", fontStyle: "italic", marginTop: 2, fontWeight: isTransitioning ? 700 : 400 }}>
                  {isTransitioning ? "Opening workspace now…" : "Ready to explore. Click below to enter your workspace."}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>
                    📊 Power BI Visuals & Slicers
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.3 }}>
                    Synchronous cross-filtering across KPIs, sparklines, charts, and maps.
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>
                    📑 Automated Reports
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.3 }}>
                    1-click PDF export to local PC and leadership email dispatch.
                  </div>
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
                type="button"
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
                type="button"
                onClick={() => handleFinish(true)}
                style={{
                  background: "transparent",
                  color: "#64748B",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "6px 8px"
                }}
                title="Skip onboarding guidance and enter workspace"
              >
                Skip ➔
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
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
                type="button"
                onClick={() => handleFinish()}
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 7,
                  padding: "7px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.15s ease"
                }}
              >
                Enter Workspace ➔
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
