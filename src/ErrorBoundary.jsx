// src/ErrorBoundary.jsx
import React from "react";
import ExplainableErrorCard from "./components/common/ExplainableErrorCard";
import { createExplainableError, ERROR_CATEGORIES } from "./utils/errorExplainer";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      explainableError: null
    };
  }

  static getDerivedStateFromError(error) {
    const expErr = createExplainableError(error, {
      category: ERROR_CATEGORIES.SYSTEM_ERROR,
      service: "frontend-workspace",
      stage: "UI Presentation Layer",
      userTitle: "We couldn't render this view",
      whatHappened: "A visual component encountered an unexpected formatting condition while rendering.",
      whatYouCanDo: "Click Auto-Recover to refresh your workspace state safely without losing your dataset."
    });
    return { hasError: true, explainableError: expErr };
  }

  componentDidCatch(error, errorInfo) {
    // In production, send strictly sanitized telemetry to monitoring service
    if (console && console.error) {
      console.error("[Enterprise ErrorBoundary] Contained UI Exception:", {
        id: this.state.explainableError?.id,
        componentStack: errorInfo?.componentStack?.slice(0, 300)
      });
    }
  }

  handleAutoRecover = () => {
    sessionStorage.removeItem("aida_draft");
    this.setState({ hasError: false, explainableError: null });
    window.location.reload();
  };

  handleResetState = () => {
    localStorage.removeItem("aida_recent_errors");
    sessionStorage.clear();
    this.setState({ hasError: false, explainableError: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
        }}>
          <div style={{ maxWidth: 640, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36 }}>🛡️</div>
              <h1 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
                AI Business Copilot — Safe Recovery Mode
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
                Your data and dataset versions are safely preserved. No corrupted state was committed.
              </p>
            </div>

            <ExplainableErrorCard
              error={this.state.explainableError}
              onRetry={this.handleAutoRecover}
              onReviewData={() => {
                sessionStorage.clear();
                window.location.href = "/";
              }}
              onGetHelp={() => {
                alert(`Error ID: ${this.state.explainableError?.id}\nPlease share this Error ID with your workspace administrator.`);
              }}
              userRole="admin"
            />

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
              <button
                onClick={this.handleAutoRecover}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                🔄 Auto-Recover Workspace
              </button>
              <button
                onClick={this.handleResetState}
                style={{
                  background: "#F1F5F9",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                🧹 Clear Session & Re-Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
