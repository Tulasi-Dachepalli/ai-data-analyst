import React from "react";

export default function Button({ children, onClick, variant = "primary", disabled, style = {}, ...props }) {
  const baseStyle = {
    padding: "8px 16px",
    fontSize: "13.5px",
    fontWeight: 600,
    borderRadius: "var(--radius-sm)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    gap: "8px"
  };

  const variants = {
    primary: {
      backgroundColor: "var(--accent-color)",
      color: "var(--accent-text)"
    },
    secondary: {
      backgroundColor: "var(--bg-hover)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-color)"
    },
    danger: {
      backgroundColor: "var(--danger)",
      color: "#ffffff"
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
