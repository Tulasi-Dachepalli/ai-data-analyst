import React from "react";

export default function Badge({ children, variant = "info", style = {}, ...props }) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase"
  };

  const variants = {
    info: {
      backgroundColor: "var(--bg-hover)",
      color: "var(--text-secondary)"
    },
    success: {
      backgroundColor: "rgba(16, 185, 129, 0.15)",
      color: "var(--success)"
    },
    warning: {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
      color: "var(--warning)"
    },
    danger: {
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      color: "var(--danger)"
    }
  };

  return (
    <span style={{ ...baseStyle, ...variants[variant], ...style }} {...props}>
      {children}
    </span>
  );
}
