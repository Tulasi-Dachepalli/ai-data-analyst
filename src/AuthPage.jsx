import { useState, useEffect } from "react";
import * as api from "./api";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4E0D8",
  fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box"
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#5C584F", marginBottom: 4, display: "block" };
const buttonStyle = (loading) => ({
  marginTop: 4, background: "#2B2A27", color: "#fff", border: "none", borderRadius: 8,
  padding: "10px 12px", fontSize: 13.5, fontWeight: 600, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1
});

const TITLES = {
  login: "Log in to your company workspace.",
  signup: "Create your company workspace.",
  forgot: "We'll email you a link to reset your password.",
  reset: "Choose a new password."
};

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot" | "reset"
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // A password-reset email link lands here as /?reset_token=... — pick it
  // up, switch straight to the reset form, and scrub it out of the URL so
  // it doesn't linger in browser history or get accidentally shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token");
    if (token) {
      setResetToken(token);
      setMode("reset");
      params.delete("reset_token");
      const clean = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", clean);
    }
  }, []);

  const switchMode = (next) => {
    setError("");
    setInfo("");
    setMode(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { email, password } : { companyName, email, password };
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      localStorage.setItem("aida_token", data.token);
      localStorage.setItem("aida_user", JSON.stringify(data.user));
      onAuthenticated(data.token, data.user);
    } catch (err) {
      setError("Could not reach the server. Is the backend running?");
    }
    setLoading(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setInfo(res?.message || "If an account exists for that email, a reset link has been sent.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(resetToken, password);
      setPassword("");
      setConfirmPassword("");
      setResetToken(null);
      setInfo("Password updated — you can log in now.");
      setMode("login");
    } catch (err) {
      setError(err.message || "Could not reset your password. The link may have expired.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F0EEE9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ width: 360, background: "#fff", border: "1px solid #E4E0D8", borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#2B2A27", marginBottom: 4 }}>AI Data Analyst</div>
        <div style={{ fontSize: 13, color: "#8A8580", marginBottom: 20 }}>{TITLES[mode]}</div>

        {mode === "forgot" && (
          <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            {error && <div style={{ fontSize: 12.5, color: "#B85C5C" }}>{error}</div>}
            {info && <div style={{ fontSize: 12.5, color: "#4C7A5E" }}>{info}</div>}
            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>New password</label>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input style={inputStyle} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
            </div>
            {error && <div style={{ fontSize: 12.5, color: "#B85C5C" }}>{error}</div>}
            {info && <div style={{ fontSize: 12.5, color: "#4C7A5E" }}>{info}</div>}
            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}

        {(mode === "login" || mode === "signup") && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <div>
                <label style={labelStyle}>Company name</label>
                <input style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." required />
                <div style={{ fontSize: 11, color: "#A6A196", marginTop: 4 }}>
                  First person from a company becomes its admin. Teammates can join later using the same company name.
                </div>
              </div>
            )}
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
            </div>
            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: -8 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); switchMode("forgot"); }} style={{ fontSize: 11.5, color: "#3E6F8E" }}>
                  Forgot password?
                </a>
              </div>
            )}

            {error && <div style={{ fontSize: 12.5, color: "#B85C5C" }}>{error}</div>}
            {info && <div style={{ fontSize: 12.5, color: "#4C7A5E" }}>{info}</div>}

            <button type="submit" disabled={loading} style={buttonStyle(loading)}>
              {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 16, fontSize: 12.5, color: "#8A8580", textAlign: "center" }}>
          {mode === "login" && (
            <>No account yet? <a href="#" onClick={(e) => { e.preventDefault(); switchMode("signup"); }} style={{ color: "#3E6F8E" }}>Sign up</a></>
          )}
          {mode === "signup" && (
            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }} style={{ color: "#3E6F8E" }}>Log in</a></>
          )}
          {(mode === "forgot" || mode === "reset") && (
            <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }} style={{ color: "#3E6F8E" }}>Back to login</a>
          )}
        </div>
      </div>
    </div>
  );
}
