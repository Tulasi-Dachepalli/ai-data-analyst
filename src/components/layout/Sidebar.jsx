// src/components/layout/Sidebar.jsx
import React from "react";
import { useRole } from "../../context/RoleContext";
import CreditsBadge from "../common/CreditsBadge";
import { useLanguage } from "../../utils/i18n";

export default function Sidebar({ currentView, setView, isOpen, setIsOpen }) {
  const { roleConfig, user } = useRole();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";
  const navItems = [
    { id: "overview", label: t("nav_overview", "Executive Overview"), icon: "🏠" },
    { id: "datasets", label: t("nav_datasets", "Datasets"), icon: "📂" },
    { id: "ai-analyst", label: t("nav_ai_analyst", "AI Copilot Chat"), icon: "🤖" },
    { id: "exec-reports", label: t("nav_reports", "Reports"), icon: "📄" },
    { id: "settings", label: t("nav_settings", "Settings"), icon: "⚙" }
  ];

  return (
    <aside style={{
      width: 240,
      background: "var(--bg-secondary, #FFFFFF)",
      borderRight: "1px solid var(--border-color, #E2E8F0)",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 90,
      display: "flex",
      flexDirection: "column",
      transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      transition: "transform 0.2s ease-in-out",
      boxSizing: "border-box"
    }}>
      {/* Brand Header */}
      <div style={{
        height: 56,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justify: "space-between",
        borderBottom: "1px solid var(--border-color, #E2E8F0)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 15, color: "var(--text-primary, #0F172A)" }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            color: "#FFF",
            display: "flex",
            alignItems: "center",
            justify: "center",
            fontSize: 14,
            fontWeight: 800
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-primary, #0F172A)", lineHeight: 1.1 }}>AI Business Copilot</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary, #64748B)", fontWeight: 500 }}>One AI. Every Business Role.</div>
          </div>
        </div>
      </div>

      {/* Role Scope Badge */}
      <div style={{ padding: "12px 16px 8px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          Role Scope
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary, #0F172A)", background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <span>{roleConfig.title}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: "8px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => {
          const isActive = currentView === item.id || (item.id === "overview" && currentView === "dashboard");
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "9px 12px",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#2563EB" : "var(--text-primary, #475569)",
                background: isActive ? "rgba(37, 99, 235, 0.08)" : "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover, #F1F5F9)"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Real-time Credits & Quota Status Card */}
      <div style={{ padding: "0 12px 10px" }}>
        <CreditsBadge variant="card" />
      </div>

      {/* System Footer Link */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border-color, #E2E8F0)", display: "flex", flexDirection: "column", gap: 4 }}>
        <button
          onClick={() => setView("team")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: currentView === "team" || currentView === "admin" || currentView === "admin-members" ? 700 : 500,
            color: currentView === "team" || currentView === "admin" || currentView === "admin-members" ? "#2563EB" : "var(--text-primary, #475569)",
            background: currentView === "team" || currentView === "admin" || currentView === "admin-members" ? "rgba(37, 99, 235, 0.08)" : "transparent",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          <span style={{ fontSize: 16 }}>🛡️</span>
          <span>{isAdmin ? "Admin & User Directory" : "Admin & Audit Center"}</span>
        </button>

        <button
          onClick={() => setView("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: currentView === "settings" ? 700 : 500,
            color: currentView === "settings" ? "#2563EB" : "var(--text-primary, #475569)",
            background: currentView === "settings" ? "rgba(37, 99, 235, 0.08)" : "transparent",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          <span style={{ fontSize: 16 }}>⚙</span>
          <span>Role & System Settings</span>
        </button>
      </div>
    </aside>
  );
}
