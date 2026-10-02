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
