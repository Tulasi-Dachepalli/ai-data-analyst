// src/components/layout/RoleSelector.jsx
import React, { useState, useRef, useEffect } from "react";
import { ROLE_CONFIGS } from "../../config/roleConfigs";
import { useRole } from "../../context/RoleContext";

export default function RoleSelector() {
  const { activeRole, setRole, roleConfig } = useRole();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-secondary, #FFFFFF)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12.5,
          fontWeight: 700,
          color: "var(--text-primary, #0F172A)",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.15s ease"
        }}
      >
        <span>{roleConfig.title}</span>
        <span style={{ fontSize: 10, color: "#64748B" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          background: "var(--bg-secondary, #FFFFFF)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: 12,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          width: 260,
          zIndex: 100,
          padding: 6,
          overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px 8px", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Switch Role Scope
          </div>
          {Object.values(ROLE_CONFIGS).map(r => {
            const isSelected = r.id === activeRole;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setRole(r.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justify: "space-between",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? "#2563EB" : "var(--text-primary, #0F172A)",
                  background: isSelected ? "rgba(37, 99, 235, 0.08)" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  marginBottom: 2,
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-hover, #F1F5F9)"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span>{r.title}</span>
                {isSelected && <span style={{ fontSize: 12, fontWeight: 700 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
