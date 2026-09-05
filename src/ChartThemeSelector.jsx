import React, { useState } from "react";

export const CHART_THEMES = {
  cobalt: {
    name: "Cobalt Blue",
    primary: "#3E6F8E",
    colors: ["#3E6F8E", "#4882A5", "#6B9EBF", "#8EBAD8", "#5A8BA8"]
  },
  emerald: {
    name: "Emerald Tech",
    primary: "#10B981",
    colors: ["#10B981", "#059669", "#047857", "#34D399", "#6EE7B7"]
  },
  purple: {
    name: "Purple Velvet",
    primary: "#8B5CF6",
    colors: ["#8B5CF6", "#7C3AED", "#6D28D9", "#A78BFA", "#C4B5FD"]
  },
  sunset: {
    name: "Sunset Gold",
    primary: "#F59E0B",
    colors: ["#F59E0B", "#D97706", "#B45309", "#FBBF24", "#FDE68A"]
  },
  midnight: {
    name: "Midnight Dark",
    primary: "#1E293B",
    colors: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8"]
  }
};

export function getChartPalette() {
  try {
    const key = localStorage.getItem("aida_chart_theme") || "cobalt";
    if (CHART_THEMES[key]) return CHART_THEMES[key];
  } catch (e) {}
  return CHART_THEMES.cobalt;
}

export default function ChartThemeSelector({ onThemeChange }) {
  const [activeKey, setActiveKey] = useState(() => {
    return localStorage.getItem("aida_chart_theme") || "cobalt";
  });

  const handleSelect = (key) => {
    setActiveKey(key);
    localStorage.setItem("aida_chart_theme", key);
    if (onThemeChange) onThemeChange(CHART_THEMES[key]);
    window.dispatchEvent(new Event("chart_theme_change"));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary, #6B7280)" }}>
        🎨 Theme:
      </span>
      <select
        value={activeKey}
        onChange={(e) => handleSelect(e.target.value)}
        style={{
          padding: "5px 10px",
          borderRadius: 6,
          border: "1px solid var(--border-color, #CBD5E1)",
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: "#FFF",
          color: "var(--text-primary, #1E293B)",
          cursor: "pointer"
        }}
      >
        {Object.entries(CHART_THEMES).map(([key, theme]) => (
          <option key={key} value={key}>
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}
