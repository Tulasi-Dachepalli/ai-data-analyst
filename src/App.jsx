import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import DataAnalystDashboardBot from "./DataAnalystDashboardBot";
import AuthPage from "./AuthPage";
import AdminPage from "./AdminPage";
import TrustPage from "./TrustPage";
import SettingsPage from "./SettingsPage";
import AppShell from "./components/layout/AppShell";
import DatasetsPage from "./DatasetsPage";
import DashboardsPage from "./DashboardsPage";
import InsightsPage from "./InsightsPage";
import ReportsPage from "./ReportsPage";
import * as api from "./api";

const DEFAULT_USER = {
  fullName: "Tulasi",
  email: "demo.executive@enterprise.com",
  role: "ceo",
  companyName: "Acme Enterprise",
  tier: "pro"
};

export default function App() {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem("aida_token");
    if (!t || t === "undefined" || t === "null") {
      return null;
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
    return null;
  });
  const [authMode, setAuthMode] = useState("landing"); // "landing" | "login" | "signup"
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return hash || "dashboard";
  });
  const [resendState, setResendState] = useState("idle"); // "idle" | "sending" | "sent" | "error"
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.toggleFullScreen) {
      window.toggleFullScreen = () => {
        if (!document.fullscreenElement) {
          const docEl = document.documentElement;
          if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
          else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
          else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          else if (document.msExitFullscreen) document.msExitFullscreen();
        }
      };
    }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash) setView(hash);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = localStorage.getItem("aida_user");
        if (raw && raw !== "undefined" && raw !== "null") {
          const u = JSON.parse(raw);
          if (u && u.email) setUser(u);
        }
      } catch (e) {}
    };
    window.addEventListener("aida_user_updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("aida_user_updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
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
    setAuthMode("landing");
  };

  const handleLogout = () => {
    localStorage.removeItem("aida_token");
    localStorage.removeItem("aida_user");
    setToken(null);
    setUser(null);
    setAuthMode("landing");
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
    if (authMode === "login" || authMode === "signup") {
      return (
        <AuthPage
          initialMode={authMode}
          onAuthenticated={handleAuthenticated}
          onBackToLanding={() => setAuthMode("landing")}
        />
      );
    }

    return (
      <LandingPage
        onGetStarted={() => setAuthMode("signup")}
        onSignIn={() => setAuthMode("login")}
        onExploreDemo={() => {
          const demoUser = {
            fullName: "Guest Executive",
            email: "demo.executive@enterprise.com",
            role: "ceo",
            companyName: "Acme Enterprise (Demo)",
            tier: "pro",
            isDemo: true
          };
          const demoToken = "demo-session-token-" + Date.now();
          localStorage.setItem("aida_token", demoToken);
          localStorage.setItem("aida_user", JSON.stringify(demoUser));
          setToken(demoToken);
          setUser(demoUser);
          setView("dashboard");
          setTimeout(() => {
            window.dispatchEvent(new Event("trigger-explore-demo"));
          }, 50);
        }}
      />
    );
  }

  const isAdmin = user?.role === "admin";
  const showVerifyBanner = false; // Email verification removed

  const isMisAnalyst = user?.role === "mis_analyst";
  const isDataAnalyst = user?.role === "data_analyst";

  const renderContent = () => {
    // 1. Strict Administrator Authorization Guard
    if (["team", "admin", "admin-members", "admin-audit", "security-center"].includes(view)) {
      if (!isAdmin) {
        return (
          <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 40, textAlign: "center", margin: "40px auto", maxWidth: 640, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
              Access Restricted — Administrator Authorization Required
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary, #475569)", margin: "0 0 16px 0", lineHeight: 1.6 }}>
              The Team User Directory, Security Controls, and Audit Logs are strictly restricted to Workspace Administrators. Your current role is <strong>{user?.role?.toUpperCase() || "CEO"}</strong> ({user?.email || "User"}). Administrator permissions must be assigned and verified by the backend system administrator.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginTop: 20 }}>
              <button
                onClick={() => setView("dashboard")}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 6px rgba(37,99,235,0.25)"
                }}
              >
                <span>⬅️</span> Return to BI Workspace
              </button>
            </div>
          </div>
        );
      }
      return (
        <AdminPage
          currentUserEmail={user?.email}
          onBack={() => setView("dashboard")}
          initialTab={view === "admin-audit" ? "audit" : (view === "security-center" ? "security" : "dashboard")}
        />
      );
    }

    if (isMisAnalyst && ["reports", "clustering", "forecast", "ml"].includes(view)) {
      return (
        <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 40, textAlign: "center", margin: "40px auto", maxWidth: 640 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
            Access Restricted — MIS Analyst Role
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #475569)", margin: "0 0 20px 0", lineHeight: 1.6 }}>
            Machine Learning model training, unsupervised clustering, and AI time-series forecasting are restricted for the MIS Analyst role.
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

    if (view === "admin-security" || view === "security") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }
    if (view === "settings") {
      return <SettingsPage user={user} onUserChange={handleUserChange} onBack={() => setView("dashboard")} />;
    }
    if (view === "trust") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }

    // All workspace navigation views (overview, datasets, ai-analyst, dashboards, insights, reports)
    return <DataAnalystDashboardBot currentView={view} setView={setView} user={user} />;
  };

  const handleUserChange = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("aida_user", JSON.stringify(updatedUser));
  };

  return (
    <AppShell user={user} currentView={view} setView={setView} onLogout={handleLogout} onUserChange={handleUserChange}>
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
