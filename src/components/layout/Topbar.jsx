import React, { useState, useEffect } from "react";

export default function Topbar({ user, darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) {
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem("aida_credits");
    return saved !== null ? parseInt(saved, 10) : 50;
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("aida_credits");
      if (saved !== null) setCredits(parseInt(saved, 10));
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleResetCredits = () => {
    localStorage.setItem("aida_credits", "50");
    setCredits(50);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const topbarStyle = {
    height: "56px",
    backgroundColor: "var(--bg-secondary)",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    position: "fixed",
    top: 0,
    right: 0,
    left: sidebarOpen ? "240px" : 0,
    zIndex: 99,
    transition: "left 0.2s ease-in-out",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)"
  };

  return (
    <div style={topbarStyle}>
      {/* Search Input Palette Trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          padding: "4px"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-sm)",
          padding: "6px 12px",
          width: "280px",
          maxWidth: "100%",
          boxSizing: "border-box"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ fontSize: "12.5px", color: "var(--text-muted)", flex: 1 }}>Search anything...</span>
          <span style={{
            fontSize: "10px",
            fontWeight: 700,
            backgroundColor: "var(--border-color)",
            color: "var(--text-secondary)",
            padding: "2px 5px",
            borderRadius: "4px"
          }}>
            ⌘K
          </span>
        </div>
      </div>

      {/* Action Utilities */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        
        {/* Interactive AI Credits Badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "var(--radius-sm)",
          padding: "4px 10px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#D97706"
        }} title="AI Credits remaining for Q&A queries, ML Modeling & Data Cleaning">
          <span>⚡ AI Credits:</span>
          <strong>{credits} / 50</strong>
          <button
            onClick={handleResetCredits}
            style={{
              background: "#D97706",
              color: "#FFF",
              border: "none",
              borderRadius: "4px",
              padding: "2px 6px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "4px"
            }}
            title="Reset credits back to 50"
          >
            + Reset
          </button>
        </div>

        {/* Dark Mode Switcher Toggle */}
        <button onClick={toggleDarkMode} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          padding: "6px",
          borderRadius: "var(--radius-sm)",
          transition: "background-color 0.15s ease"
        }} title="Toggle light/dark theme">
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* User initials bubble indicator */}
        <div style={{
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          backgroundColor: "var(--accent-color)",
          color: "var(--accent-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          boxShadow: "var(--shadow-sm)"
        }}>
          {user?.email ? user.email.slice(0, 2).toUpperCase() : "US"}
        </div>
      </div>
    </div>
  );
}
