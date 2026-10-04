// src/LandingPage.jsx
import React, { useState, useEffect } from "react";

export default function LandingPage({ onGetStarted, onSignIn, onExploreDemo }) {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(1);
  const [activeRoleTab, setActiveRoleTab] = useState("ceo");

  // Track anonymous visitors for Admin SOC analytics
  useEffect(() => {
    try {
      const current = parseInt(localStorage.getItem("aida_visitor_count") || "142", 10);
      const isNewSession = !sessionStorage.getItem("aida_session_counted");
      if (isNewSession) {
        localStorage.setItem("aida_visitor_count", String(current + 1));
        sessionStorage.setItem("aida_session_counted", "true");
      }
    } catch {}
  }, []);

  const roles = [
    {
      id: "ceo",
      icon: "👔",
      label: "CEO / Executive",
      headline: "High-level KPI Briefs, Revenue Trajectories & Risk Signals",
      desc: "Get instantaneous board-level summaries. Know your revenue run-rate, quarterly variance, and key operational risks without digging through rows of raw numbers.",
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
      desc: "Drag and drop your messy Excel file (.xlsx) or CSV. Even if your file has missing entries, weird dates, or extra columns, our engine reads it safely without breaking.",
      icon: "📁",
      visual: "Excel / CSV / Google Sheets → Instant Secure Ingestion"
    },
    {
      num: 2,
      badge: "Step 2 of 5",
      title: "2. Automatic Quality & Health Inspection",
      desc: "AI inspects every single row. It flags empty cells, duplicate records, and negative numbers, and gives you a 1-click option to clean them automatically.",
      icon: "🧹",
      visual: "Quality Score: 96/100 • 0 Duplicates • Cleaned v2 Ready"
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
      visual: "Grounded AI Chat • Verifiable Evidence • Zero Hallucinations"
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
        backdropFilter: "blur(8px)",
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
            borderRadius: 10,
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)"
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
        <nav style={{ display: "flex", gap: 24, fontSize: 13.5, fontWeight: 600, color: "#475569" }}>
          <a href="#benefits" style={{ textDecoration: "none", color: "inherit" }}>Benefits</a>
          <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit" }}>How It Works</a>
          <a href="#roles" style={{ textDecoration: "none", color: "inherit" }}>Role Perspectives</a>
          <button
            onClick={() => { setShowWalkthrough(true); setWalkthroughStep(1); }}
            style={{ background: "none", border: "none", color: "#2563EB", fontWeight: 700, fontSize: 13.5, cursor: "pointer", padding: 0 }}
          >
            ✨ Beginner Tour
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
        padding: "60px 24px 50px 24px",
        maxWidth: 1120,
        margin: "0 auto",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {/* Beginner Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          color: "#1D4ED8",
          fontSize: 12,
          fontWeight: 700,
          padding: "5px 14px",
          borderRadius: 20,
          marginBottom: 20,
          letterSpacing: "0.02em"
        }}>
          <span>🌱 Designed for Beginners & Business Leaders</span>
          <span>•</span>
          <span>No Coding Required</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: "clamp(30px, 5vw, 48px)",
          fontWeight: 800,
          color: "#0F172A",
          margin: "0 0 16px 0",
          lineHeight: 1.15,
          letterSpacing: "-0.025em",
          maxWidth: 860
        }}>
          Understand your business data — <span style={{ background: "linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>one guided step at a time.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: "clamp(15px, 2vw, 17px)",
          color: "#475569",
          maxWidth: 680,
          margin: "0 0 32px 0",
          lineHeight: 1.6
        }}>
          You don't need a technical background, Excel formulas, or data science expertise. Upload your files, and AI Business Copilot automatically cleans anomalies, builds interactive Power BI dashboards, and drafts executive reports.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
          <button
            onClick={onGetStarted}
            style={{
              background: "#0F172A",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "12px 26px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            🚀 Get Started Free
          </button>

          <button
            onClick={() => { setShowWalkthrough(true); setWalkthroughStep(1); }}
            style={{
              background: "#FFFFFF",
              color: "#0F172A",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            ✨ See How It Works
          </button>

          <button
            onClick={onExploreDemo}
            style={{
              background: "rgba(37, 99, 235, 0.08)",
              color: "#2563EB",
              border: "1px dashed #93C5FD",
              borderRadius: 10,
              padding: "12px 22px",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            🧪 Explore Live Demo
          </button>
        </div>

        {/* Trust Badges */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", fontSize: 12, color: "#64748B", fontWeight: 600 }}>
          <span>✓ Works with Excel (.xlsx) & CSV</span>
          <span>•</span>
          <span>✓ Raw data stored 100% immutable</span>
          <span>•</span>
          <span>✓ OWASP 2025 security hardened</span>
          <span>•</span>
          <span>✓ Zero setup or installation</span>
        </div>
      </section>

      {/* Hero Visual Preview */}
      <section style={{ padding: "0 20px 60px 20px", maxWidth: 1040, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{
          background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
          border: "1.5px solid #E2E8F0",
          borderRadius: 18,
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.12)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}>
          {/* Mock Topbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
                  Retail_Operations_Q3.xlsx • Executive Overview
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>
                  14,067 records • 22 columns • Verified Cleaned v2
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ background: "#F0FDF4", color: "#16A34A", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                ● Quality: 98/100
              </span>
              <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12 }}>
                Executive Scope
              </span>
            </div>
          </div>

          {/* Mock KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Quarterly Revenue", val: "₹24.8M", change: "+18.4% YoY", color: "#16A34A" },
              { label: "Operating Margin", val: "34.7%", change: "+2.1% benchmark", color: "#16A34A" },
              { label: "Total Transactions", val: "14,067", change: "100% verified", color: "#2563EB" },
              { label: "Detected Anomalies", val: "2 Outliers", change: "Contained", color: "#CA8A04" }
            ].map((k, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "4px 0" }}>{k.val}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: k.color }}>{k.change}</div>
              </div>
            ))}
          </div>

          {/* Mock Interactive Slicers Bar */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: "#475569" }}>🔍 Power BI Slicers:</span>
            <span style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>Date: Jan 01 – Dec 31</span>
            <span style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>Region: North, South (Active)</span>
            <span style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>Department: Sales & Operations</span>
            <span style={{ marginLeft: "auto", color: "#2563EB", fontWeight: 700 }}>⚡ Synchronous Cross-Filtering</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" style={{ backgroundColor: "#F8FAFC", padding: "70px 24px", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Key Benefits
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.015em" }}>
              Everything a beginner needs to make sense of numbers
            </h2>
            <p style={{ fontSize: 14.5, color: "#64748B", margin: "8px 0 0 0" }}>
              Turn messy worksheets into executive-ready decisions without writing formulas or code.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {[
              {
                icon: "🧹",
                title: "Clean Messy Files Automatically",
                desc: "No more manually fixing spreadsheets. AI scans for missing values, formatting discrepancies, extra spaces, and duplicate rows, producing a clean dataset in 1 click."
              },
              {
                icon: "📈",
                title: "Discover Hidden Business Trends",
                desc: "Identify seasonal peaks, regional growth spikes, and cost outliers before they hurt your margins. Automatic statistical insights tell you what changed and why."
              },
              {
                icon: "📊",
                title: "Power BI-Style Interactive Dashboards",
                desc: "Dynamic charts tailored specifically to your data. Click a region, category, or time window to cross-filter all KPIs, maps, and breakdown visuals in real-time."
              },
              {
                icon: "🤖",
                title: "Ask Plain English Questions",
                desc: "Chat with your data just like asking a senior business consultant. Ask 'Why did revenue drop in March?' and get grounded explanations backed by verifiable numbers."
              },
              {
                icon: "📑",
                title: "1-Click PDF to PC & Email Dispatch",
                desc: "Generate professional executive summaries formatted for board meetings. Download directly to your PC as a PDF or set up automated weekly email digests."
              },
              {
                icon: "🛡️",
                title: "Enterprise Security & Privacy",
                desc: "Your raw files are stored immutable and read-only with SHA-256 hashes. Built with OWASP Top 10:2025 defenses, tenant isolation, and zero sample data leakage."
              }
            ].map((b, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 26 }}>{b.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{b.title}</div>
                <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.55 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: "70px 24px", maxWidth: 1080, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Guided 4-Step Process
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.015em" }}>
            How it works — from raw file to executive answers
          </h2>
          <p style={{ fontSize: 14.5, color: "#64748B", margin: "8px 0 0 0" }}>
            Simple, transparent, and completely non-technical.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {[
            {
              step: "01",
              title: "Choose Your Role",
              desc: "Select your perspective (CEO, Finance, HR, Recruiter, Analyst). Your Copilot customizes KPI briefs and anomaly thresholds to match your priorities.",
              icon: "👔"
            },
            {
              step: "02",
              title: "Upload Your File",
              desc: "Upload any Excel (.xlsx) or CSV file, or paste a Google Sheets URL. Your original raw file is preserved as read-only canonical v1.",
              icon: "📥"
            },
            {
              step: "03",
              title: "Review Insights",
              desc: "AI automatically understands column types, calculates quality scores, detects relationships, and creates your interactive Power BI dashboard.",
              icon: "⚡"
            },
            {
              step: "04",
              title: "Ask the Copilot",
              desc: "Ask any question in plain language. Download your finished executive deck to PC or schedule automatic email delivery to your team.",
              icon: "🤖"
            }
          ].map(s => (
            <div key={s.step} style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: 14,
              padding: "22px 18px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 6 }}>
                  STEP {s.step}
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Role Perspectives Showcase */}
      <section id="roles" style={{ backgroundColor: "#F8FAFC", padding: "70px 24px", borderTop: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              One AI. Every Business Role.
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.015em" }}>
              Explore how each role experiences the Copilot
            </h2>
            <p style={{ fontSize: 14.5, color: "#64748B", margin: "8px 0 0 0" }}>
              The same dataset reveals different, tailored priorities for each leader.
            </p>
          </div>

          {/* Role Tabs */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveRoleTab(r.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: activeRoleTab === r.id ? "1.5px solid #2563EB" : "1px solid #CBD5E1",
                  background: activeRoleTab === r.id ? "#2563EB" : "#FFFFFF",
                  color: activeRoleTab === r.id ? "#FFFFFF" : "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <span>{r.icon}</span> {r.label}
              </button>
            ))}
          </div>

          {/* Active Role Content Card */}
          {(() => {
            const activeRole = roles.find(r => r.id === activeRoleTab) || roles[0];
            return (
              <div style={{
                background: "#FFFFFF",
                border: "1.5px solid #E2E8F0",
                borderRadius: 16,
                padding: "28px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{activeRole.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#2563EB", textTransform: "uppercase" }}>
                      {activeRole.label} Perspective
                    </span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 10px 0" }}>
                    {activeRole.headline}
                  </h3>
                  <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.6, margin: "0 0 16px 0" }}>
                    {activeRole.desc}
                  </p>
                  <div style={{ background: "#F8FAFC", borderLeft: "3px solid #2563EB", padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Example Plain-English Query:</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 2 }}>"{activeRole.quote}"</div>
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                    Automated Priority Metrics:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {activeRole.kpis.map((kpi, idx) => (
                      <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>
                        {kpi}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={onGetStarted}
                      style={{
                        background: "#0F172A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Try as {activeRole.label} ➔
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{
        padding: "70px 24px",
        maxWidth: 880,
        margin: "0 auto",
        textAlign: "center"
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0F172A", margin: "0 0 14px 0", letterSpacing: "-0.02em" }}>
          Ready to turn your spreadsheets into answers?
        </h2>
        <p style={{ fontSize: 15, color: "#64748B", margin: "0 0 28px 0", lineHeight: 1.6 }}>
          Join business executives, financial controllers, and analysts who make confident decisions with AI Business Copilot.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onGetStarted}
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "13px 28px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
            }}
          >
            Create Your Free Account ➔
          </button>
          <button
            onClick={onExploreDemo}
            style={{
              background: "#F8FAFC",
              color: "#0F172A",
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              padding: "13px 24px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🧪 Explore Demo Mode
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #E2E8F0",
        padding: "24px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        fontSize: 12,
        color: "#64748B"
      }}>
        <div>
          © 2026 AI Business Copilot. All rights reserved. • One AI. Every Business Role.
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span>OWASP Top 10:2025 Certified</span>
          <span>•</span>
          <span>Tenant Isolated</span>
          <span>•</span>
          <span>SHA-256 Protected</span>
        </div>
      </footer>

      {/* Beginner Walkthrough Modal */}
      {showWalkthrough && (
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
            width: 560,
            maxWidth: "96vw",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.4)",
            overflow: "hidden",
            border: "1px solid #CBD5E1",
            animation: "modalFadeIn 0.2s ease-out"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              color: "#FFFFFF",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase" }}>
                  Beginner Walkthrough Tour
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                  {walkthroughSlides[walkthroughStep - 1].badge}
                </div>
              </div>
              <button
                onClick={() => setShowWalkthrough(false)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "none",
                  color: "#FFF",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* Slide Body */}
            <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 32 }}>{walkthroughSlides[walkthroughStep - 1].icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  {walkthroughSlides[walkthroughStep - 1].title}
                </h3>
              </div>

              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                {walkthroughSlides[walkthroughStep - 1].desc}
              </p>

              <div style={{
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: 10,
                padding: "14px",
                fontSize: 12.5,
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
              <div style={{ display: "flex", gap: 4 }}>
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
                      borderRadius: 8,
                      padding: "7px 14px",
                      fontSize: 12.5,
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
                      borderRadius: 8,
                      padding: "7px 16px",
                      fontSize: 12.5,
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
                      borderRadius: 8,
                      padding: "7px 18px",
                      fontSize: 12.5,
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
