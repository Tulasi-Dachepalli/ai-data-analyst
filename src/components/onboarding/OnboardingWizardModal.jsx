// src/components/onboarding/OnboardingWizardModal.jsx
import React, { useState } from "react";
import { useRole } from "../../context/RoleContext";
import { useActivity } from "../../context/ActivityContext";

export default function OnboardingWizardModal({ isOpen, onClose, onUploadClick, onGoogleSheetsClick }) {
  const { user, roleConfig, setRole } = useRole();
  const { logEvent } = useActivity();
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const displayName = user?.fullName || (user?.email ? user.email.split("@")[0].replace(/[._]/g, " ") : "Tulasi");
  const company = user?.companyName || "Your Enterprise";

  const steps = [
    {
      num: 1,
      badge: "Step 1 of 5 • Welcome",
      title: `Welcome, ${displayName}! Let's personalize your workspace`,
      subtitle: "Select your role so your AI Copilot customizes KPI briefs, anomaly thresholds, and executive summaries."
    },
    {
      num: 2,
      badge: "Step 2 of 5 • Data Ingestion",
      title: "Bring Your Business Data In Seconds",
      subtitle: "Upload any CSV, Excel (.xlsx), or connect Google Sheets. Your raw data is safely stored as immutable v1."
    },
    {
      num: 3,
      badge: "Step 3 of 5 • AI Understanding",
      title: "Automatic Quality & Health Scoring",
      subtitle: "You don't need to know data science. AI scans schemas, detects anomalies, and generates cleaning proposals."
    },
    {
      num: 4,
      badge: "Step 4 of 5 • Natural Language Copilot",
      title: "Ask Any Question in Plain English",
      subtitle: "Chat with your data just like asking a senior business analyst. Every answer includes verifiable evidence."
    },
    {
      num: 5,
      badge: "Step 5 of 5 • Automated Reports",
      title: "1-Click PDF to PC & Auto-Email Delivery",
      subtitle: "Generate board-ready executive reports, save them directly to your PC, and dispatch them automatically to your team's inbox."
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
    if (currentStep < 5) {
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
      backgroundColor: "rgba(15, 23, 42, 0.72)",
      backdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        width: 680,
        maxWidth: "96vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        animation: "modalFadeIn 0.25s ease-out"
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px",
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
              gap: 6,
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38BDF8",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 20,
              letterSpacing: "0.04em",
              textTransform: "uppercase"
            }}>
              ✨ AI Business Copilot Guide
            </div>
            <h2 style={{
              fontFamily: "var(--font-heading, 'Manrope', sans-serif)",
              fontSize: 22,
              fontWeight: 800,
              margin: "10px 0 4px 0",
              letterSpacing: "-0.02em"
            }}>
              {steps[currentStep - 1].title}
            </h2>
            <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, maxWidth: 520 }}>
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
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease"
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
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }} />
        </div>

        {/* Body Content */}
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "65vh", overflowY: "auto" }}>
          
          {/* STEP 1: Personalization & Role Selection */}
          {currentStep === 1 && (
            <div>
              <div style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#2563EB",
                    color: "#FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 14
                  }}>
                    {displayName[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                      {displayName} • <span style={{ color: "#64748B", fontWeight: 500 }}>{company}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B" }}>{user?.email || "Registered User"}</div>
                  </div>
                </div>
                <div style={{
                  background: "#DCFCE7",
                  border: "1px solid #86EFAC",
                  color: "#166534",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 12
                }}>
                  ● Active Workspace
                </div>
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Select Your Perspective:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { id: "ceo", icon: "👔", label: "CEO / Executive", desc: "High-level KPI Briefs, Revenue Trends, Risk Signals" },
                  { id: "data_analyst", icon: "📊", label: "Data Analyst", desc: "Data Profiling, Schema Validation, Quality Scores" },
                  { id: "finance", icon: "💰", label: "Finance Director", desc: "Budget Variance, Expense Leakage, Cost Outliers" },
                  { id: "data_scientist", icon: "🧪", label: "Data Scientist", desc: "Automated ML Models, Regression, Forecasting" }
                ].map(r => {
                  const isSelected = roleConfig?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        border: isSelected ? "2px solid #2563EB" : "1px solid #E2E8F0",
                        background: isSelected ? "#EFF6FF" : "#FFFFFF",
                        padding: "14px 16px",
                        borderRadius: 12,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.12)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{r.icon}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: isSelected ? "#1E40AF" : "#0F172A" }}>
                          {r.label}
                        </span>
                        {isSelected && <span style={{ marginLeft: "auto", color: "#2563EB", fontWeight: 800 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", lineHeight: 1.4 }}>{r.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Data Ingestion */}
          {currentStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                background: "#F8FAFC",
                border: "2px dashed #CBD5E1",
                borderRadius: 14,
                padding: "24px 20px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                  Upload Any Business File to Start
                </div>
                <div style={{ fontSize: 12.5, color: "#64748B", maxWidth: 440, margin: "6px auto 16px auto" }}>
                  Supported formats: CSV, Excel (.xlsx, .xls), JSON, and Parquet. No technical setup or database coding required.
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      onClose();
                      if (onUploadClick) onUploadClick();
                    }}
                    style={{
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    + Upload CSV / Excel Now
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
                      borderRadius: 10,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    📊 Connect Google Sheets
                  </button>
                </div>
              </div>

              <div style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12
              }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.4 }}>
                  <strong>Zero-Leakage & Raw Immutability:</strong> Your uploaded file is sealed with an immutable SHA-256 fingerprint (v1 Raw). Cleaning steps produce traceable versions (v2, v3) without altering your original data.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Automated Quality & AI Profiling */}
          {currentStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12
              }}>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                    🎯 Instant Health Score (0-100)
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
                    Evaluates completeness, duplicate rows, invalid date timestamps, and negative outlier values in under 2 seconds.
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                    🤖 1-Click Smart Cleaning
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
                    AI identifies missing entries, suggests median/mode imputation, and displays a side-by-side diff before saving.
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                    📈 Automated KPI Cards
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
                    Discovers key numeric dimensions, sums, averages, and month-over-month growth curves automatically.
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                    🛡️ Enterprise RBAC Protection
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
                    Sensitive fields like salaries or customer PII are masked based on authorized organizational roles.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Plain English Natural Language Copilot */}
          {currentStep === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#475569" }}>
                Click or type any business question in the Copilot bar at any time. Try these examples once your data is uploaded:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { q: "What was our highest revenue month and why?", note: "Identifies volume spikes and anomalies" },
                  { q: "Which product categories generate 80% of our gross margin?", note: "Pareto 80/20 distribution analysis" },
                  { q: "Forecast next quarter's demand with a 95% confidence interval.", note: "AutoML time-series projection" },
                  { q: "Are there any data quality issues in customer zip codes?", note: "Anomaly & outlier scan" }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>"{item.q}"</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{item.note}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "3px 8px", borderRadius: 6 }}>
                      Ask AI
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Executive Report Download & Automated Email */}
          {currentStep === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
                border: "1px solid #BFDBFE",
                borderRadius: 14,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF" }}>
                  📦 Everything Your Leadership Team Needs:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: "1px solid #BFDBFE" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>💾 1-Click Save to PC</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      Download print-perfect executive PDF, Excel multi-sheet (.xlsx), and PowerPoint decks (.pptx).
                    </div>
                  </div>
                  <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: "1px solid #BFDBFE" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>✉ Automatic Email Dispatch</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                      Sends compiled findings and charts directly to {user?.email || "your registered email"} with 1 click.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: "#64748B", textAlign: "center", marginTop: 4 }}>
                Ready to transform your business data into decisions? Let's get started.
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
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748B", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            Don't show this popup on launch
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  borderRadius: 10,
                  padding: "9px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                ← Back
              </button>
            )}

            {currentStep === 2 ? (
              <button
                onClick={() => {
                  handleFinish();
                  if (onUploadClick) onUploadClick();
                }}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                }}
              >
                Upload File & Begin →
              </button>
            ) : currentStep < 5 ? (
              <button
                onClick={handleNext}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 22px",
                  fontSize: 13,
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
                  borderRadius: 10,
                  padding: "9px 22px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
                }}
              >
                Enter Workspace Now →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
