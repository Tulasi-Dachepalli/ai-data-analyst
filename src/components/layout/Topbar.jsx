// src/components/layout/Topbar.jsx
import React from "react";
import RoleSelector from "./RoleSelector";
import { useRole } from "../../context/RoleContext";

import AIActivityButton from "../activity/AIActivityButton";
import AIActivityDrawer from "../activity/AIActivityDrawer";

import GlobalSearch from "../search/GlobalSearch";
import DecisionInbox from "../command-center/DecisionInbox";
import ShareDialog from "../collaboration/ShareDialog";
import { useSearch } from "../../context/SearchContext";
import { useDecision } from "../../context/DecisionContext";
import { useCollaboration } from "../../context/CollaborationContext";

export default function Topbar({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen, onLogout, setView, onOpenGuide }) {
  const { user } = useRole();
  const { openSearch } = useSearch();
  const { pendingDecisions, openInbox } = useDecision();
  const { openShareModal } = useCollaboration();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
      justifyContent: "space-between",
      padding: "0 20px",
      transition: "left 0.2s ease-in-out",
      boxSizing: "border-box"
    }}>
      {/* Left: Sidebar Toggle, Role Selector & Search Trigger */}
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

        {/* Global Search Quick Trigger */}
        <button
          onClick={openSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: 8,
            background: "var(--bg-primary, #F8FAFC)",
            border: "1px solid var(--border-color, #CBD5E1)",
            fontSize: 12,
            color: "var(--text-secondary, #64748B)",
            cursor: "pointer"
          }}
        >
          <span>🔍</span>
          <span style={{ fontWeight: 600 }}>Quick Search...</span>
          <kbd style={{ fontSize: 10, background: "var(--bg-secondary, #FFFFFF)", border: "1px solid #CBD5E1", padding: "1px 5px", borderRadius: 4 }}>Ctrl+K</kbd>
        </button>
      </div>

      {/* Right: AI Activity, Decision Inbox, Theme Toggle, Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Decision Inbox Badge Button */}
        <button
          data-testid="topbar-decisions-btn"
          onClick={openInbox}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 8,
            background: pendingDecisions.length > 0 ? "#FEF2F2" : "#F8FAFC",
            border: `1px solid ${pendingDecisions.length > 0 ? "#FCA5A5" : "#E2E8F0"}`,
            fontSize: 12,
            fontWeight: 700,
            color: pendingDecisions.length > 0 ? "#DC2626" : "#475569",
            cursor: "pointer"
          }}
        >
          <span>⚡</span>
          <span>Decisions</span>
          {pendingDecisions.length > 0 && (
            <span style={{
              background: "#DC2626",
              color: "#FFF",
              fontSize: 10,
              fontWeight: 800,
              padding: "1px 6px",
              borderRadius: 10
            }}>
              {pendingDecisions.length}
            </span>
          )}
        </button>

        {/* AI Guide Helper Button */}
        <button
          onClick={onOpenGuide || (() => window.dispatchEvent(new Event("open-ai-guide")))}
          title="Open First-Time AI Guide"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            border: "1px solid #BFDBFE",
            fontSize: 12,
            fontWeight: 700,
            color: "#1E40AF",
            cursor: "pointer"
          }}
        >
          <span>✨</span>
          <span>Copilot Guide</span>
        </button>

        {/* Workspace Share Button */}
        <button
          data-testid="topbar-share-btn"
          onClick={() => openShareModal("Active Workspace")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            borderRadius: 8,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            fontSize: 12,
            fontWeight: 700,
            color: "#475569",
            cursor: "pointer"
          }}
        >
          <span>👥</span>
          <span>Share</span>
        </button>

        {/* Global AI Activity Stream Indicator */}
        <AIActivityButton />
        <AIActivityDrawer />
        
        {/* Modals */}
        <GlobalSearch />
        <DecisionInbox />
        <ShareDialog />

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

        {/* User Profile Pill with Interactive Dropdown Menu */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => setUserMenuOpen(prev => !prev)}
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
              background: user?.isDemo ? "#F59E0B" : "#2563EB",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700
            }}>
              {user?.isDemo ? "D" : (user?.email || "U")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary, #0F172A)" }}>
              {user?.email ? user.email.split("@")[0] : "User"}
            </span>
            <span style={{ fontSize: 9, color: "#94A3B8" }}>▼</span>
          </div>

          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                width: 220,
                zIndex: 1000,
                padding: "8px 0",
                fontSize: 12.5
              }}
            >
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ fontWeight: 700, color: "#0F172A" }}>{user?.fullName || "User"}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{user?.email || ""}</div>
                {user?.isDemo && (
                  <span style={{ display: "inline-block", background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginTop: 4 }}>
                    🟡 Guest Demo Mode
                  </span>
                )}
              </div>

              <div
                onClick={() => { setUserMenuOpen(false); if (setView) setView("settings"); }}
                style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#334155" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span>⚙️</span> <span>Workspace Settings</span>
              </div>

              <div
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                style={{ padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#DC2626", borderTop: "1px solid #F1F5F9" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span>🚪</span> <span>{user?.isDemo ? "Exit Demo Mode" : "Sign Out"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}
