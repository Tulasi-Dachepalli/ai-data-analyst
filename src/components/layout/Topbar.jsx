// src/components/layout/Topbar.jsx
import React from "react";
import RoleSelector from "./RoleSelector";
import { useRole } from "../../context/RoleContext";

export default function Topbar({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen, onLogout, setView }) {
  const { user } = useRole();

  return (
    <header style={{
      height: 56,
      background: "var(--bg-secondary, #FFFFFF)",
      borderBottom: "1px solid var(--border-color, #E2E8F0)",
      position: "fixed",
      top: 0,
      right: 0,
      left: sidebarOpen ? 240 : 0,
      zIndex: 80,
      display: "flex",
      alignItems: "center",
      justify: "space-between",
      padding: "0 20px",
      transition: "left 0.2s ease-in-out",
      boxSizing: "border-box"
    }}>
      {/* Left: Sidebar Toggle & Role Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle Sidebar Navigation"
          style={{
            background: "none",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 14,
            cursor: "pointer",
            color: "var(--text-primary, #0F172A)"
          }}
        >
          ☰
        </button>

        <RoleSelector />
      </div>

      {/* Right: Theme Toggle, Notifications, Settings & User Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Dark Mode"
          style={{
            background: "none",
            border: "none",
            fontSize: 16,
            cursor: "pointer",
            padding: "4px 8px"
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Notifications */}
        <button
          title="System Notifications"
          style={{
            background: "none",
            border: "none",
            fontSize: 16,
            cursor: "pointer",
            position: "relative",
            padding: "4px 8px"
          }}
        >
          🔔
          <span style={{
            position: "absolute",
            top: 2,
            right: 4,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#EF4444"
          }} />
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => setView && setView("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "4px 10px",
            borderRadius: 20,
            background: "var(--bg-primary, #F8FAFC)",
            border: "1px solid var(--border-color, #E2E8F0)",
            cursor: "pointer"
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#2563EB",
            color: "#FFF",
            display: "flex",
            alignItems: "center",
            justify: "center",
            fontSize: 11,
            fontWeight: 700
          }}>
            {(user?.email || "U")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary, #0F172A)" }}>
            {user?.email ? user.email.split("@")[0] : "User"}
          </span>
        </div>
      </div>
    </header>
  );
}
