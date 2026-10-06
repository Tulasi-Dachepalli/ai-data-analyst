// src/LandingPage.jsx
import React, { useState, useEffect } from "react";

export default function LandingPage({ onGetStarted, onSignIn, onExploreDemo }) {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(1);
  const [activeRoleTab, setActiveRoleTab] = useState("ceo");
  const [activeLevelTab, setActiveLevelTab] = useState("beginner");

  // Send visit events to backend analytics service to track site-wide unique browsers
  useEffect(() => {
    try {
      let browserId = localStorage.getItem("aida_browser_client_id") || localStorage.getItem("aida_unique_visitor_id");
      if (!browserId) {
        browserId = "client_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
        localStorage.setItem("aida_browser_client_id", browserId);
      }

      let sessionId = sessionStorage.getItem("aida_browser_session_id");
      if (!sessionId) {
        sessionId = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
        sessionStorage.setItem("aida_browser_session_id", sessionId);
      }

      const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "https://ai-data-analyst-backend-2.onrender.com";
      fetch(`${base}/api/analytics/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: browserId, sessionId })
      }).catch((err) => {
        console.warn("Analytics telemetry notice:", err);
      });
    } catch (e) {
      console.warn("Analytics counter notice:", e);
    }
  }, []);

  const experienceLevels = [
    {
      id: "beginner",
      title: "Beginner — Guided",
      tagline: "Start with a business goal. Zero formulas or coding required.",
      idealFor: "Founders, Non-technical Managers, Department Leads",
      startPoint: "Choose a business goal (e.g., 'Understand Sales', 'Review Spending')",
      features: [
        "Automated data readiness checklist with plain-English diagnostics",
        "1-click cleaning previews with before/after row change counts",
        "Automatic Power BI-style visuals with conversational explanations",
        "Grounded AI Copilot queries with verifiable metric citations"
      ],
      badgeColor: "#059669",
      badgeBg: "#ECFDF5"
    },
    {
      id: "intermediate",
      title: "Intermediate — Explore",
      tagline: "Customize dashboards, define metrics, and cross-filter data.",
      idealFor: "Business Analysts, Operations Managers, Financial Planners",
      startPoint: "Choose a dataset, connect Google Sheets, or select an existing dashboard",
      features: [
        "Drag-and-drop dashboard customization with interactive slicers",
        "Custom business metric builder (e.g. EBITDA margin, customer CAC)",
        "Multi-version dataset comparison and quality audit diffs",
        "Guided statistical correlation heatmaps and trend decompositions"
      ],
      badgeColor: "#2563EB",
      badgeBg: "#EFF6FF"
    },
    {
      id: "advanced",
      title: "Advanced — Studio",
      tagline: "Full analytical control, approved SQL, and reproducible pipelines.",
      idealFor: "Data Scientists, Quantitative Analysts, BI Engineers",
      startPoint: "Open a pipeline workbench, write SQL, or run predictive ML models",
      features: [
        "Sandboxed SQL execution with workspace-scoped permissions",
        "Automated machine learning model comparison with R² and MAE tuning",
        "Time-series forecasting with Prophet / ARIMA and confidence bands",
        "Auditable transformation ledger with Point-In-Time recovery (PITR)"
      ],
      badgeColor: "#7C3AED",
      badgeBg: "#F5F3FF"
    }
  ];

  const roles = [
    {
      id: "ceo",
      icon: "👔",
      label: "CEO / Executive",
      headline: "High-level KPI Briefs, Revenue Trajectories & Risk Signals",
      desc: "Get instantaneous board-level summaries. Know your revenue run-rate, quarterly variance, and key operational risks without digging through raw tables.",
      kpis: ["Total Revenue: ₹24.8M", "Profit Margin: 34.7%", "Risk Index: Low (1.2%)", "Quarterly Growth: +18.4%"],
      quote: "What needs my executive attention this week?"
    },
    {
      id: "finance",
      icon: "💰",
      label: "Finance Director",
      headline: "Budget vs Actual Variance, Expense Leakage & Cost Outliers",
      desc: "Spot budget overruns and margin compression immediately. Detect unusual billing spikes, vendor cost drift, and department-level expenditure anomalies.",
      kpis: ["Operating Budget: ₹16.2M", "Cost Variance: -4.1%", "Unusual Expenses: 3 detected", "Net EBITDA: ₹8.6M"],
      quote: "Why did department travel expenses jump 28% in March?"
    },
    {
      id: "hr",
      icon: "👥",
      label: "HR Executive",
      headline: "Headcount Analytics, Employee Turnover & Retention Risk",
      desc: "Analyze employee retention, attrition drivers, and team health. Benchmark department turnover rates and discover early signals of staff burnout.",
      kpis: ["Active Headcount: 1,420", "Annual Turnover: 8.2%", "Retention Index: 92/100", "Avg Tenancy: 3.4 yrs"],
      quote: "Which engineering departments have the highest attrition risk?"
    },
    {
      id: "recruiter",
      icon: "🎯",
      label: "Talent Recruiter",
      headline: "Candidate Pipeline Velocity & Interview-to-Offer Funnel",
      desc: "Track hiring pipelines from application to offer acceptance. Optimize time-to-hire, recruiter capacity, and offer acceptance ratios across open requisitions.",
      kpis: ["Open Requisitions: 38", "Pipeline Velocity: 21 days", "Interview Pass Rate: 42%", "Offer Acceptance: 88%"],
      quote: "Where is the bottleneck in our senior engineering hiring pipeline?"
    },
    {
      id: "data_analyst",
      icon: "📊",
      label: "Data Analyst",
      headline: "Automated Data Profiling, Schema Validation & Quality Scores",
      desc: "Save hours of manual data wrangling. Automatically detect column data types, find missing values, run IQR outlier checks, and build interactive pivot tables.",
      kpis: ["Data Quality Score: 98/100", "Missing Values: 0.2%", "Outliers Flagged: 12", "Cleaned Schema: 18 cols"],
      quote: "Run an automated correlation heatmap and flag dirty columns."
    },
    {
      id: "data_scientist",
      icon: "🧪",
      label: "Data Scientist",
      headline: "Automated Machine Learning, Linear Regression & Time-Series",
      desc: "Train predictive regression models and generate statistical time-series forecasts with confidence bounds—directly in your browser or through isolated Python sandboxes.",
      kpis: ["Model R² Score: 0.924", "Mean Absolute Error: 1.4%", "Forecast Horizon: 90 days", "Algorithm: Prophet / OLS"],
      quote: "Forecast revenue trajectory for the next two quarters with 95% confidence intervals."
    }
  ];

  const walkthroughSlides = [
    {
      num: 1,
      badge: "Step 1 of 5",
      title: "1. Start With Any File (No Data Cleaning Needed)",
      desc: "Drag and drop your Excel file (.xlsx) or CSV. Even if your file has missing entries, irregular dates, or extra columns, our engine reads it safely without breaking.",
      icon: "📁",
      visual: "Excel / CSV / Google Sheets → Instant Secure Ingestion"
    },
    {
      num: 2,
      badge: "Step 2 of 5",
      title: "2. Automatic Quality & Health Inspection",
      desc: "AI inspects every single row. It flags empty cells, duplicate records, and negative numbers, and gives you a 1-click option to clean them automatically.",
      icon: "🧹",
      visual: "Quality Score: 98/100 • 0 Duplicates • Cleaned v2 Ready"
    },
    {
      num: 3,
      badge: "Step 3 of 5",
      title: "3. Power BI-Style Interactive Dashboard",
      desc: "Watch as your spreadsheet turns into an interactive BI dashboard. Click any slicer (e.g. 'South Region' or 'Sales Dept') to synchronously filter all charts and metrics in real-time.",
      icon: "📊",
      visual: "Global Dropdown Slicers • Time-Series Area Chart • Regional Map"
    },
    {
      num: 4,
      badge: "Step 4 of 5",
      title: "4. Ask Questions In Everyday English",
      desc: "You don't need SQL or Excel formulas. Simply ask: 'Why did sales drop last month?' or 'Show top 5 products by margin'. Your Copilot answers with numbers and evidence.",
      icon: "🤖",
      visual: "Grounded AI Chat • Verifiable Evidence • Auditable Metric Citations"
    },
    {
      num: 5,
      badge: "Step 5 of 5",
      title: "5. Download PDF to Your PC or Email Leadership",
      desc: "Turn your entire analysis into a board-ready executive report with 1 click. Save a crisp PDF directly to your computer or send an automated digest to your team's inbox.",
      icon: "📑",
      visual: "1-Click Local PDF Download • Scheduled Email Delivery"
    }
  ];

  return (
    <div style={{
      fontFamily: "var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      color: "#0F172A",
      backgroundColor: "#FFFFFF",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E2E8F0",
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)"
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>
              AI Business Copilot
            </div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 500 }}>
              One AI. Every Business Role.
            </div>
          </div>
        </div>

        {/* Center Links (Desktop) */}
        <nav style={{ display: "flex", gap: 24, fontSize: 13.5, fontWeight: 600, color: "#475569", alignItems: "center" }}>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit" }}>How It Works</a>
          <a href="#experience-levels" style={{ textDecoration: "none", color: "inherit" }}>3 Experience Levels</a>
          <a href="#roles" style={{ textDecoration: "none", color: "inherit" }}>6 Roles</a>
          <a href="#security" style={{ textDecoration: "none", color: "inherit" }}>Security & RBAC</a>
          <button
            onClick={() => { setShowWalkthrough(true); setWalkthroughStep(1); }}
            style={{
              background: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              color: "#2563EB",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 6
            }}
          >
            🎬 Interactive Tour
          </button>
        </nav>

        {/* Right CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onSignIn}
            style={{
              background: "transparent",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              transition: "transform 0.15s ease"
            }}
          >
            Get Started Free ➔
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: "64px 24px 48px 24px",
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 40,
          alignItems: "center"
        }}>
          {/* Left Column: Headlines & CTAs */}
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#F1F5F9",
              border: "1px solid #CBD5E1",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 16
            }}>
              <span>🛡️</span>
              <span>Enterprise AI Business Intelligence • RBAC Governed</span>
            </div>

            <h1 style={{
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 800,
              color: "#0F172A",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 16px 0"
            }}>
              Turn business data into clear decisions.
            </h1>

            <p style={{
              fontSize: 16,
              color: "#475569",
              lineHeight: 1.6,
              margin: "0 0 28px 0",
              maxWidth: 540
            }}>
              Upload your spreadsheets, explore guided insights, and build interactive Power BI dashboards and executive reports—all in one workspace. Start with guidance or use advanced analysis tools.
            </p>

            {/* Main Action CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={onGetStarted}
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 9,
                  padding: "12px 24px",
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.15s ease"
                }}
              >
                Get Started Free ➔
              </button>

              <button
                onClick={() => { setShowWalkthrough(true); setWalkthroughStep(1); }}
                style={{
                  background: "#F8FAFC",
                  color: "#0F172A",
                  border: "1px solid #CBD5E1",
                  borderRadius: 9,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>🎬</span>
                <span>See How It Works</span>
              </button>

              <button
                onClick={onExploreDemo}
                style={{
                  background: "none",
                  color: "#2563EB",
                  border: "none",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: "6px 10px"
                }}
              >
                🧪 Explore Live Demo
              </button>
            </div>

            {/* Quick Guarantees Pill Bar */}
            <div style={{
              display: "flex",
              gap: 20,
              marginTop: 28,
              fontSize: 12,
              color: "#64748B",
              flexWrap: "wrap"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span> Zero training on customer data
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span> 6-Role RBAC access control
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span> Instant browser export
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Product Preview Card */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.12)",
            overflow: "hidden"
          }}>
            {/* Mock Topbar Header */}
            <div style={{
              background: "#0F172A",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#FFFFFF"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700 }}>
                <span style={{ color: "#38BDF8" }}>✦</span>
                <span>Executive BI Dashboard — Q3 Performance</span>
              </div>
              <div style={{
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38BDF8",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4
              }}>
                ROLE: CEO
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div style={{ padding: 16, background: "#F8FAFC", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                  Illustrative Sample Data Preview
                </span>
                <span style={{ fontSize: 10, color: "#64748B" }}>
                  Active Template: Superstore_Q3.csv
                </span>
              </div>
              {/* Slicers Row */}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "#0F172A" }}>
                  Region: <strong>All (North, South, West)</strong> ▾
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "#0F172A" }}>
                  Period: <strong>Last 90 Days</strong> ▾
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Net Revenue</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "2px 0" }}>₹24,850,200</div>
                  <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700 }}>▲ +18.4% vs target</div>
                </div>
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>EBITDA Margin</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: "2px 0" }}>34.7%</div>
                  <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700 }}>▲ Healthy variance</div>
                </div>
              </div>

              {/* Copilot Grounded Answer Snippet */}
              <div style={{
                background: "#FFFFFF",
                border: "1px solid #BFDBFE",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#1D4ED8" }}>
                  <span>🤖</span>
                  <span>Copilot Answer (Grounded strictly on dataset rows)</span>
                </div>
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                  "South Region delivered 41% of total quarterly volume. Average order size increased by ₹1,420 following the new catalog expansion."
                </div>
                <div style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>
                  Source: Superstore_Q3.csv • Rows 1–12,480 • Calculation ID: #metric_rev_01
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Experience Levels Section */}
      <section id="experience-levels" style={{
        background: "#F8FAFC",
        borderTop: "1px solid #E2E8F0",
        borderBottom: "1px solid #E2E8F0",
        padding: "64px 24px"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              display: "inline-block",
              background: "#E2E8F0",
              color: "#475569",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 12,
              textTransform: "uppercase",
              marginBottom: 8
            }}>
              One Platform • Three Ways to Work
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 10px 0" }}>
              Tailored for every technical background.
            </h2>
            <p style={{ fontSize: 14.5, color: "#64748B", maxWidth: 600, margin: "0 auto" }}>
              Experience level adjusts interface complexity—not security permissions. Switch modes anytime without losing data or history.
            </p>
          </div>

          {/* Level Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {experienceLevels.map(lvl => {
              const isSelected = activeLevelTab === lvl.id;
              return (
                <div
                  key={lvl.id}
                  onClick={() => setActiveLevelTab(lvl.id)}
                  style={{
                    background: "#FFFFFF",
                    border: isSelected ? "2px solid #2563EB" : "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: 24,
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 8px 24px rgba(37, 99, 235, 0.12)" : "0 2px 8px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{
                      background: lvl.badgeBg,
                      color: lvl.badgeColor,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 6
                    }}>
                      {lvl.title}
                    </span>
                    {isSelected && <span style={{ color: "#2563EB", fontWeight: 800, fontSize: 13 }}>✓ Selected</span>}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
                    {lvl.tagline}
                  </h3>

                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
                    <strong>Ideal for:</strong> {lvl.idealFor}
                  </div>

                  <div style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 11.5,
                    color: "#334155",
                    marginBottom: 16
                  }}>
                    <strong>Starting point:</strong> {lvl.startPoint}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                    {lvl.features.map((feat, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#475569" }}>
                        <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 Core Capabilities Section */}
      <section style={{ padding: "64px 24px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 10px 0" }}>
            Four pillars of unified business intelligence.
          </h2>
          <p style={{ fontSize: 14.5, color: "#64748B", maxWidth: 560, margin: "0 auto" }}>
            Everything your team needs to inspect, visualize, analyze, and present business records.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 22, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧹</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>1. Prepare & Clean Data</h3>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Automatic schema profiling flags missing values, invalid dates, and outliers with 1-click preview fixes. Raw source records are immutably preserved.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 22, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>2. Power BI Dashboards</h3>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Interactive slicers synchronously filter KPIs, charts, and tables in real-time. Cross-filter by department, region, customer segment, or fiscal quarter.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 22, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>3. Grounded Copilot Q&A</h3>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Ask questions in plain English. Every answer is mathematically grounded in your verified rows, backed by explicit row citations and auditable calculation proofs.
            </p>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 22, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📑</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>4. Board-Ready PDF Reports</h3>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Export executive reports directly to your local PC or schedule recurring automated email dispatches to leadership with 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works (4 Clear Steps) */}
      <section id="how-it-works" style={{
        background: "#F8FAFC",
        borderTop: "1px solid #E2E8F0",
        borderBottom: "1px solid #E2E8F0",
        padding: "64px 24px"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 10px 0" }}>
              How it works: from upload to boardroom in four steps.
            </h2>
            <p style={{ fontSize: 14.5, color: "#64748B", maxWidth: 540, margin: "0 auto" }}>
              No complex database connections or data engineering pipelines required.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { step: "01", title: "Upload or Connect", desc: "Drop your CSV or Excel file, or connect live Google Sheets. Records are immutably ingested." },
              { step: "02", title: "Automatic Quality Check", desc: "Schema validation inspects health, flags missing values, and prepares cleaned version v2." },
              { step: "03", title: "Explore with Cross-Filtering", desc: "Interact with Power BI visuals, adjust slicers, and chat with grounded AI Copilot." },
              { step: "04", title: "Export & Dispatch", desc: "Download high-resolution PDF report to local drive or dispatch scheduled summary emails." }
            ].map(s => (
              <div key={s.step} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", letterSpacing: "0.05em", marginBottom: 6 }}>
                  STEP {s.step}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.5 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Business Roles Showcase */}
      <section id="roles" style={{ padding: "64px 24px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-block",
            background: "#EFF6FF",
            color: "#2563EB",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 12,
            textTransform: "uppercase",
            marginBottom: 8
          }}>
            Role-Based Access Control (RBAC)
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: "0 0 10px 0" }}>
            Tailored perspectives for every department leader.
          </h2>
          <p style={{ fontSize: 14.5, color: "#64748B", maxWidth: 560, margin: "0 auto" }}>
            The AI changes terminology, KPIs, and permissions based on authorized roles. Sensitive columns like compensation are restricted by server policies.
          </p>
        </div>

        {/* Role Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveRoleTab(r.id)}
              style={{
                background: activeRoleTab === r.id ? "#0F172A" : "#F8FAFC",
                color: activeRoleTab === r.id ? "#FFFFFF" : "#475569",
                border: activeRoleTab === r.id ? "1px solid #0F172A" : "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease"
              }}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Active Role Content Card */}
        {(() => {
          const cur = roles.find(r => r.id === activeRoleTab) || roles[0];
          return (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: 12,
              padding: 28,
              boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 28,
              alignItems: "center"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{cur.icon}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{cur.headline}</span>
                </div>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                  {cur.desc}
                </p>
                <div style={{
                  background: "#F8FAFC",
                  borderLeft: "3px solid #2563EB",
                  padding: "10px 14px",
                  borderRadius: "0 8px 8px 0",
                  fontSize: 13,
                  color: "#1E293B",
                  fontStyle: "italic"
                }}>
                  Example Question: "{cur.quote}"
                </div>
              </div>

              {/* KPI Badges Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {cur.kpis.map((kpi, idx) => (
                  <div key={idx} style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0F172A"
                  }}>
                    {kpi}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Verified Security & Compliance Section */}
      <section id="security" style={{
        background: "#0F172A",
        color: "#FFFFFF",
        padding: "64px 24px"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              display: "inline-block",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 12,
              textTransform: "uppercase",
              marginBottom: 8
            }}>
              Enterprise Grade Protection
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 10px 0" }}>
              Verified security and zero training guarantees.
            </h2>
            <p style={{ fontSize: 14, color: "#94A3B8", maxWidth: 560, margin: "0 auto" }}>
              Your business data is strictly private. We implement defensible controls at every layer.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🔒</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>Zero-Training AI Binding</div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                Under Anthropic Commercial Terms and Gemini Paid Enterprise API agreements, customer prompts and datasets are never used for model training.
              </div>
            </div>

            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🛡️</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>Outbound PII Sanitization</div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                Restricted columns (salaries, SSNs, credit cards) are filtered server-side based on authorized role policies before any prompt leaves the backend.
              </div>
            </div>

            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>🏢</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>Multi-Tenant Isolation</div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                All database queries and cache keys enforce company_id scoping. Cross-tenant access attempts return 404 with zero metadata exposure.
              </div>
            </div>

            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>📜</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 6 }}>Immutable Audit Trail</div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                Every upload, cleaning rule, role elevation, and report download is recorded in SOC-aligned compliance audit logs for governance review.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section style={{
        padding: "60px 24px",
        textAlign: "center",
        background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
        borderTop: "1px solid #E2E8F0"
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 10px 0" }}>
            Ready to understand your business data?
          </h2>
          <p style={{ fontSize: 14.5, color: "#64748B", margin: "0 0 24px 0" }}>
            Start in Guided Beginner mode or open Advanced Studio tools. No credit card required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onGetStarted}
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
              }}
            >
              Get Started Free ➔
            </button>
            <button
              onClick={onSignIn}
              style={{
                background: "#FFFFFF",
                color: "#0F172A",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Sign In to Existing Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        padding: "36px 28px",
        fontSize: 12,
        color: "#64748B"
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div>
            <strong style={{ color: "#0F172A" }}>AI Business Copilot</strong> — Enterprise BI & Automated Analytics.
            <div style={{ marginTop: 4 }}>
              © {new Date().getFullYear()} All rights reserved. Zero training binding on client records.
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#how-it-works" style={{ textDecoration: "none", color: "#64748B" }}>How It Works</a>
            <a href="#experience-levels" style={{ textDecoration: "none", color: "#64748B" }}>Experience Levels</a>
            <a href="#security" style={{ textDecoration: "none", color: "#64748B" }}>Security</a>
            <span onClick={() => { setShowWalkthrough(true); setWalkthroughStep(1); }} style={{ color: "#2563EB", cursor: "pointer", fontWeight: 600 }}>Interactive Tour</span>
          </div>
        </div>
      </footer>

      {/* Beginner Walkthrough Modal (5-Step Tour) */}
      {showWalkthrough && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16
        }}>
          <div style={{
            width: 520,
            maxWidth: "95vw",
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #CBD5E1"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              background: "#0F172A",
              color: "#FFFFFF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{walkthroughSlides[walkthroughStep - 1].icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase" }}>
                  {walkthroughSlides[walkthroughStep - 1].badge}
                </span>
              </div>
              <button
                onClick={() => setShowWalkthrough(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  color: "#FFF",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                {walkthroughSlides[walkthroughStep - 1].title}
              </h3>

              <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                {walkthroughSlides[walkthroughStep - 1].desc}
              </p>

              <div style={{
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: 8,
                padding: "12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#2563EB",
                textAlign: "center"
              }}>
                ⚡ {walkthroughSlides[walkthroughStep - 1].visual}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div style={{
              padding: "14px 20px",
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: 5 }}>
                {walkthroughSlides.map(s => (
                  <span
                    key={s.num}
                    onClick={() => setWalkthroughStep(s.num)}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: walkthroughStep === s.num ? "#2563EB" : "#CBD5E1",
                      cursor: "pointer",
                      display: "inline-block"
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {walkthroughStep > 1 && (
                  <button
                    onClick={() => setWalkthroughStep(prev => prev - 1)}
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

                {walkthroughStep < 5 ? (
                  <button
                    onClick={() => setWalkthroughStep(prev => prev + 1)}
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
                    Next ➔
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowWalkthrough(false); onGetStarted(); }}
                    style={{
                      background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 7,
                      padding: "7px 16px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Get Started Now ➔
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
