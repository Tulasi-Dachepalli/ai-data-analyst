// src/LanguageTranslator.jsx
import React, { useState } from "react";
import { SUPPORTED_LANGUAGES, useLanguage, getCurrentLanguage } from "./utils/i18n";

export { SUPPORTED_LANGUAGES };

export function getAppLanguage() {
  return getCurrentLanguage();
}

export default function LanguageTranslator({ onLanguageChange }) {
  const { lang, setLanguage, t } = useLanguage();
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    const code = e.target.value;
    const selectedObj = setLanguage(code);
    if (onLanguageChange) {
      onLanguageChange(selectedObj);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}
      title={t("language_notice", "Controls AI Copilot responses, UI interface, and exported report language")}
    >
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary, #6B7280)", textTransform: "uppercase" }}>
        🌐 {t("language_label", "AI & Report Language:")}
      </span>
      <select
        data-testid="language-select"
        value={lang.code}
        onChange={handleChange}
        style={{
          padding: "5px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-color, #D1D5DB)",
          fontSize: 12,
          fontWeight: 700,
          backgroundColor: "var(--bg-secondary, #FFF)",
          color: "var(--text-primary, #0F172A)",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease"
        }}
      >
        {Object.values(SUPPORTED_LANGUAGES).map(item => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>

      {/* Live Confirmation Toast */}
      {showToast && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "#0F172A",
            color: "#FFFFFF",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            zIndex: 100,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
            animation: "fadeInScale 0.15s ease-out"
          }}
        >
          <span>✓</span>
          <span>{t("language_notice", `Language set to ${lang.name}`)}</span>
        </div>
      )}
    </div>
  );
}
