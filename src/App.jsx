import { useState, useEffect } from "react";
import DataAnalystDashboardBot from "./DataAnalystDashboardBot";
import AuthPage from "./AuthPage";
import AdminPage from "./AdminPage";
import TrustPage from "./TrustPage";
import AppShell from "./components/layout/AppShell";
import DatasetsPage from "./DatasetsPage";
import DashboardsPage from "./DashboardsPage";
import InsightsPage from "./InsightsPage";
import ReportsPage from "./ReportsPage";
import * as api from "./api";

const DEFAULT_USER = {
  email: "demo.executive@enterprise.com",
  role: "admin",
  companyName: "Acme Enterprise",
  tier: "pro"
};

export default function App() {
  const [token, setToken] = useState(() => {
    let t = localStorage.getItem("aida_token");
    if (!t || t === "undefined" || t === "null") {
      t = "demo-session-token-" + Date.now();
      localStorage.setItem("aida_token", t);
      if (!localStorage.getItem("aida_user")) {
        localStorage.setItem("aida_user", JSON.stringify(DEFAULT_USER));
      }
    }
    return t;
  });
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("aida_user");
      if (raw && raw !== "undefined" && raw !== "null") {
        const u = JSON.parse(raw);
        if (u && u.email) return u;
      }
    } catch (e) {
      console.warn("User parse error:", e);
    }
    localStorage.setItem("aida_user", JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  });
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return hash || "dashboard";
  });
  const [resendState, setResendState] = useState("idle"); // "idle" | "sending" | "sent" | "error"
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash) setView(hash);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    const pingBackend = async () => {
      const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "https://ai-data-analyst-backend-2.onrender.com";
      const start = Date.now();
      try {
        const res = await fetch(`${base}/health`);
        if (Date.now() - start > 3000) {
          setIsWarmingUp(false);
        }
      } catch (e) {
        setIsWarmingUp(true);
      }
    };
    pingBackend();
  }, []);

  const handleAuthenticated = (t, u) => {
    setToken(t);
    setUser(u);
    setView("dashboard");
    setResendState("idle");
  };

  const handleLogout = () => {
    localStorage.removeItem("aida_token");
    localStorage.removeItem("aida_user");
    setToken(null);
    setUser(null);
  };

  const handleResendVerification = async () => {
    setResendState("sending");
    try {
      await api.resendVerification();
      setResendState("sent");
    } catch (err) {
      setResendState("error");
    }
  };

  if (!token) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  const isAdmin = user?.role === "admin";
  const showVerifyBanner = false; // Email verification removed

  const isMisAnalyst = user?.role === "mis_analyst";
  const isDataAnalyst = user?.role === "data_analyst";

  const renderContent = () => {
    if (isMisAnalyst && ["reports", "clustering", "forecast", "ml", "team", "admin-members", "admin-audit"].includes(view)) {
      return (
        <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 40, textAlign: "center", margin: "40px auto", maxWidth: 640 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
            Access Restricted — MIS Analyst Role
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #475569)", margin: "0 0 20px 0", lineHeight: 1.6 }}>
            Machine Learning model training, unsupervised clustering, AI time-series forecasting, and Team Admin management are restricted for the MIS Analyst role.
          </p>
          <button
            onClick={() => setView("dashboard")}
            style={{ background: "var(--accent-color, #0F172A)", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Return to Executive BI Workspace
          </button>
        </div>
      );
    }

    if (isDataAnalyst && ["team", "admin-members", "admin-audit"].includes(view)) {
      return (
        <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 40, textAlign: "center", margin: "40px auto", maxWidth: 640 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
            Access Restricted — Data Analyst Role
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #475569)", margin: "0 0 20px 0", lineHeight: 1.6 }}>
            Team Administration, user invitation, and member role management are restricted to System Admins.
          </p>
          <button
            onClick={() => setView("dashboard")}
            style={{ background: "var(--accent-color, #0F172A)", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Return to Executive BI Workspace
          </button>
        </div>
      );
    }

    if ((view === "admin-members" || view === "team") && isAdmin) {
      return <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="dashboard" />;
    }
    if (view === "admin-audit" && isAdmin) {
      return <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="audit" />;
    }
    if (view === "admin-security" || view === "security") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }
    if (view === "settings" || view === "security") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }
    if (view === "trust") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }

    if (view === "team") {
      return <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="dashboard" />;
    }

    // All workspace navigation views (overview, datasets, ai-analyst, dashboards, insights, reports)
    return <DataAnalystDashboardBot currentView={view} setView={setView} user={user} />;
  };

  return (
    <AppShell user={user} currentView={view} setView={setView} onLogout={handleLogout}>
      {showVerifyBanner && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: "#FBF3E3", border: "1px solid #E9D9AE", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#7A5C1E" }}>
          <span>📧 Please verify your email ({user?.email || "user@example.com"}). Didn't receive the verification email?</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleResendVerification} disabled={resendState === "sending"}
              style={{ fontSize: 11.5, fontWeight: 600, color: "#7A5C1E", background: "none", border: "1px solid #E9D9AE", borderRadius: 6, padding: "4px 10px", cursor: resendState === "sending" ? "default" : "pointer" }}>
              {resendState === "sending" ? "Sending…" : resendState === "sent" ? "✓ Sent!" : resendState === "error" ? "Try again" : "Resend Email"}
            </button>
            <button
              onClick={() => {
                const updatedUser = { ...user, emailVerified: true };
                setUser(updatedUser);
                localStorage.setItem("aida_user", JSON.stringify(updatedUser));
              }}
              style={{ fontSize: 11.5, fontWeight: 700, color: "#FFF", background: "#7A5C1E", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
            >
              ⚡ Instant Verify & Skip
            </button>
          </div>
        </div>
      )}

      {renderContent()}
    </AppShell>
  );
}
