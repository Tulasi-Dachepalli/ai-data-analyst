import React from "react";

export default function Card({ children, style = {}, ...props }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
        boxShadow: "var(--shadow-sm)",
        boxSizing: "border-box",
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
