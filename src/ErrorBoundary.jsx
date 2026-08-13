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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFC", color: "#0F172A", fontFamily: "sans-serif", gap: 16, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Data Analyst Workspace</div>
          <div style={{ fontSize: 13.5, color: "#64748B", maxWidth: 500, lineHeight: 1.6 }}>
            A temporary display glitch occurred. Click the button below to instantly restore your workspace.
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{ background: "#0F172A", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            🔄 Restore Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
