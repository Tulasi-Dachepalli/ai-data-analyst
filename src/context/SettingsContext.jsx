// src/context/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  workspace: {
    name: "Acme Enterprise Workspace",
    company: "Acme Enterprise Inc.",
    defaultRole: "ceo",
    defaultDataset: "None",
    timezone: "UTC-5 (Eastern Time)",
    dateFormat: "YYYY-MM-DD",
    currency: "USD ($)",
    theme: "light", // light, dark, system
    density: "compact", // comfortable, compact
    dashboardLayout: "standard"
  },
  data: {
    detectTypes: true,
    detectDates: true,
    detectDuplicates: true,
    detectMissing: true,
    createQualityReport: true,
    previewRows: 100,
    automaticVersioning: true,
    supportedFormats: ["CSV", "XLSX", "XLS", "JSON", "Parquet", "TXT"]
  },
  copilot: {
    showGroundingBadges: true,
    showEvidence: true,
    showProcessingActivity: true,
    explainTransformations: true,
    showConfidenceInfo: true,
    responseStyle: "detailed", // detailed, concise
    defaultMode: "business_analysis"
  },
  notifications: {
    processingCompleted: true,
    cleaningCompleted: true,
    modelCompleted: true,
    forecastCompleted: true,
    qualityWarnings: true,
    securityEvents: true
  },
  security: {
    requireConfirmation: true,
    keepTransformationHistory: true,
    keepAuditHistory: true,
    maskSensitiveColumns: true,
    rbacEnforced: true
  },
  export: {
    defaultFormat: "PDF",
    includeCharts: true,
    includeEvidence: true,
    includeLineage: true,
    includeMethodology: true
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("aida_settings");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Error reading settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isBeginnerMode, setIsBeginnerModeState] = useState(() => {
    try {
      return localStorage.getItem("aida_user_mode") !== "pro";
    } catch {
      return true;
    }
  });

  const setBeginnerMode = (val) => {
    const isBeg = !!val;
    setIsBeginnerModeState(isBeg);
    try {
      localStorage.setItem("aida_user_mode", isBeg ? "beginner" : "pro");
      window.dispatchEvent(new Event("aida_mode_changed"));
    } catch (e) {
      console.warn("Error writing aida_user_mode to localStorage", e);
    }
  };

  const toggleBeginnerMode = () => {
    setBeginnerMode(!isBeginnerMode);
  };

  useEffect(() => {
    const handleStorage = () => {
      try {
        setIsBeginnerModeState(localStorage.getItem("aida_user_mode") !== "pro");
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("aida_mode_changed", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("aida_mode_changed", handleStorage);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("aida_settings", JSON.stringify(settings));
    } catch (e) {
      console.warn("Error saving settings to localStorage", e);
    }
  }, [settings]);

  const updateSection = (sectionKey, nextValues) => {
    setSettings(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        ...nextValues
      }
    }));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSection,
      resetDefaults: () => setSettings(DEFAULT_SETTINGS),
      isBeginnerMode,
      setIsBeginnerMode: setBeginnerMode,
      toggleBeginnerMode
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    let fallbackBeginner = true;
    try {
      fallbackBeginner = localStorage.getItem("aida_user_mode") !== "pro";
    } catch {}
    return {
      settings: DEFAULT_SETTINGS,
      updateSection: () => {},
      resetDefaults: () => {},
      isBeginnerMode: fallbackBeginner,
      setIsBeginnerMode: (val) => {
        try {
          localStorage.setItem("aida_user_mode", val ? "beginner" : "pro");
          window.dispatchEvent(new Event("aida_mode_changed"));
        } catch {}
      },
      toggleBeginnerMode: () => {}
    };
  }
  return ctx;
}
