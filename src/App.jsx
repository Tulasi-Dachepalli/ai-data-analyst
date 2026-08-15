import { useState } from "react";
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

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("aida_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aida_user")); } catch { return null; }
  });
  const [view, setView] = useState("dashboard"); // "dashboard" | "admin" | "trust"
  const [resendState, setResendState] = useState("idle"); // "idle" | "sending" | "sent" | "error"

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
  const showVerifyBanner = user && !user.emailVerified;

  const renderContent = () => {
    if (view === "admin-members" && isAdmin) {
      return <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="invites" />;
    }
    if (view === "admin-audit" && isAdmin) {
      return <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="audit" />;
    }
    if (view === "admin-security" && isAdmin) {
      return <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="danger" />;
    }
    if (view === "settings") {
      // Map global settings view to AdminPage general configurations if admin, else TrustPage
      return isAdmin ? (
        <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} initialTab="dashboard" />
      ) : (
        <TrustPage onBack={() => setView("dashboard")} />
      );
    }
    if (view === "trust") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }

    if (view === "team") {
      return <TrustPage onBack={() => setView("dashboard")} />;
    }

    // All workspace navigation views (overview, datasets, ai-analyst, dashboards, insights, reports)
    return <DataAnalystDashboardBot currentView={view} setView={setView} />;
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
