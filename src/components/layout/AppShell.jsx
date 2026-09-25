// src/components/layout/AppShell.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { RoleProvider } from "../../context/RoleContext";
import { DatasetProvider } from "../../context/DatasetContext";
import { CopilotProvider } from "../../context/CopilotContext";

export function AppShellContent({ user, currentView, setView, onLogout, onUserChange, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Theme state persisted to localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("aida_theme") === "dark";
  });

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
        />

        {/* View content slot */}
        <div style={{
          padding: isMobile ? "16px" : "24px",
          marginTop: "56px", // Header offset height
          boxSizing: "border-box",
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AppShell(props) {
  return (
    <RoleProvider initialUser={props.user}>
      <DatasetProvider>
        <CopilotProvider>
          <AppShellContent {...props} />
        </CopilotProvider>
      </DatasetProvider>
    </RoleProvider>
  );
}
