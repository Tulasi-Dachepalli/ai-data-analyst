import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ user, currentView, setView, onLogout, children }) {
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
      // Automatically close drawer on mobile entry, keep open on desktop
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update theme token class name on dark mode changes
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
        user={user}
        currentView={currentView}
        setView={setView}
        onLogout={onLogout}
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
          user={user}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
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
