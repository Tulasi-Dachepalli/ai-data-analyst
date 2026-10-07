// src/components/layout/AppShell.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { RoleProvider } from "../../context/RoleContext";
import { DatasetProvider } from "../../context/DatasetContext";
import { CopilotProvider } from "../../context/CopilotContext";
import { ActivityProvider } from "../../context/ActivityContext";
import { SettingsProvider } from "../../context/SettingsContext";
import { DecisionProvider } from "../../context/DecisionContext";
import { CollaborationProvider } from "../../context/CollaborationContext";
import { SearchProvider } from "../../context/SearchContext";

import OnboardingWizardModal from "../onboarding/OnboardingWizardModal";

export function AppShellContent({ user, currentView, setView, onLogout, onUserChange, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Theme state persisted to localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("aida_theme") === "dark" || localStorage.getItem("aida_chart_theme") === "midnight";
  });

  // First-time onboarding guide state
  const [isGuideOpen, setIsGuideOpen] = useState(() => {
    try {
      return localStorage.getItem("aida_onboarding_dismissed") !== "true";
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const handleOpenGuide = () => setIsGuideOpen(true);
    window.addEventListener("open-ai-guide", handleOpenGuide);
    return () => window.removeEventListener("open-ai-guide", handleOpenGuide);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = localStorage.getItem("aida_theme") === "dark" || localStorage.getItem("aida_chart_theme") === "midnight";
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("theme-dark");
      } else {
        document.documentElement.classList.remove("theme-dark");
      }
    };
    window.addEventListener("aida_theme_changed", handleThemeChange);
    window.addEventListener("storage", handleThemeChange);
    return () => {
      window.removeEventListener("aida_theme_changed", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("theme-dark");
      localStorage.setItem("aida_theme", "dark");
    } else {
      document.documentElement.classList.remove("theme-dark");
      localStorage.setItem("aida_theme", "light");
    }
  }, [darkMode]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-primary)",
      color: "var(--text-primary)",
      display: "flex",
      boxSizing: "border-box",
      fontFamily: "var(--font-sans)"
    }}>
      {/* Mobile Drawer Backdrop overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.3)",
            backdropFilter: "blur(2px)",
            zIndex: 98
          }}
        />
      )}

      {/* Navigation Sidebar Panel */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Content wrapper taking layout offset */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        marginLeft: (!isMobile && sidebarOpen) ? "240px" : "0",
        transition: "margin-left 0.2s ease-in-out",
        minWidth: 0,
        boxSizing: "border-box"
      }}>
        {/* Topbar Utility Controls */}
        <Topbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
          setView={setView}
          onOpenGuide={() => setIsGuideOpen(true)}
        />

        {/* View content slot */}
        <div style={{
          padding: isMobile ? "16px" : "24px",
          marginTop: "56px", // Header offset height
          boxSizing: "border-box",
          flex: 1
        }}>
          {user?.isDemo && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 18,
              fontSize: 13,
              color: "#92400E"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <span style={{ fontSize: 16 }}>🟡</span>
                <span>
                  <strong>Demo Workspace Active:</strong> You are browsing in an isolated Guest Demo mode with mock data. Real business files remain private.
                </span>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: "#92400E",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span>Exit Demo</span>
                <span>➔</span>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Persistent Floating Copilot Guide Button */}
      <button
        onClick={() => setIsGuideOpen(true)}
        title="Open AI Copilot Guide"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 90,
          background: "linear-gradient(135deg, #0F172A 0%, #2563EB 100%)",
          color: "#FFFFFF",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 30,
          padding: "10px 18px",
          fontSize: 13,
          fontWeight: 700,
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "transform 0.2s ease, box-shadow 0.2s ease"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0px)"}
      >
        <span style={{ fontSize: 16 }}>✨</span>
        <span>Copilot Guide</span>
      </button>

      {/* Onboarding Wizard Modal */}
      <OnboardingWizardModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onUploadClick={() => window.dispatchEvent(new Event("trigger-file-upload"))}
        onGoogleSheetsClick={() => window.dispatchEvent(new Event("trigger-google-sheets"))}
        onExploreDemoClick={() => window.dispatchEvent(new Event("trigger-explore-demo"))}
      />
    </div>
  );
}

export default function AppShell(props) {
  return (
    <RoleProvider initialUser={props.user}>
      <SettingsProvider>
        <DatasetProvider>
          <ActivityProvider>
            <CopilotProvider>
              <DecisionProvider>
                <CollaborationProvider>
                  <SearchProvider>
                    <AppShellContent {...props} />
                  </SearchProvider>
                </CollaborationProvider>
              </DecisionProvider>
            </CopilotProvider>
          </ActivityProvider>
        </DatasetProvider>
      </SettingsProvider>
    </RoleProvider>
  );
}
