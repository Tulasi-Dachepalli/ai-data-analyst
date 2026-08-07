import { useState } from "react";
import DataAnalystDashboardBot from "./DataAnalystDashboardBot";
import AuthPage from "./AuthPage";
import AdminPage from "./AdminPage";
import * as api from "./api";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("aida_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aida_user")); } catch { return null; }
  });
  const [view, setView] = useState("dashboard"); // "dashboard" | "admin"
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
  const showVerifyBanner = false;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
          <div style={{ fontSize: 12.5, color: "#8A8580" }}>
            {user?.companyName} · {user?.email}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isAdmin && view === "dashboard" && (
              <button onClick={() => setView("admin")}
                style={{ fontSize: 12, fontWeight: 600, color: "#2B2A27", background: "none", border: "1px solid #E4E0D8", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
                Admin
              </button>
            )}
            <button onClick={handleLogout}
              style={{ fontSize: 12, fontWeight: 600, color: "#8A8580", background: "none", border: "1px solid #E4E0D8", borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
              Log out
            </button>
          </div>
        </div>

        {showVerifyBanner && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#FBF3E3", border: "1px solid #E9D9AE", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: "#7A5C1E" }}>
            <span>Please verify your email address ({user.email}) — check your inbox for a verification link.</span>
            <button onClick={handleResendVerification} disabled={resendState === "sending"}
              style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: "#7A5C1E", background: "none", border: "1px solid #E9D9AE", borderRadius: 6, padding: "4px 9px", cursor: resendState === "sending" ? "default" : "pointer" }}>
              {resendState === "sending" ? "Sending…" : resendState === "error" ? "Try again" : "Resend email"}
            </button>
          </div>
        )}

        {view === "admin" && isAdmin ? (
          <AdminPage currentUserEmail={user?.email} onBack={() => setView("dashboard")} />
        ) : (
          <DataAnalystDashboardBot />
        )}
      </div>
    </div>
  );
}
