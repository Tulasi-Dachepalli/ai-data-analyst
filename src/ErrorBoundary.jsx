import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8FAFC", color: "#0F172A", fontFamily: "sans-serif", gap: 16, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Data Analyst Workspace</div>
          <div style={{ fontSize: 13.5, color: "#64748B", maxWidth: 500, lineHeight: 1.6 }}>
            A temporary display glitch occurred. Click below to reload your workspace.
          </div>

          {this.state.error && (
            <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", color: "#9F1239", padding: "10px 14px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", maxWidth: 600, overflowX: "auto", textAlign: "left" }}>
              <strong>Error Details:</strong> {String(this.state.error.message || this.state.error)}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                sessionStorage.clear();
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ background: "#0F172A", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              🔄 Auto-Recover Workspace
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ background: "#E2E8F0", color: "#0F172A", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              🧹 Clear All & Re-Login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
