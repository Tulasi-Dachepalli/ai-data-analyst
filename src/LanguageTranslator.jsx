import React, { useState } from "react";

export const SUPPORTED_LANGUAGES = {
  en: { code: "en", name: "English", label: "English 🇺🇸" },
  hi: { code: "hi", name: "Hindi", label: "Hindi 🇮🇳 (हिंदी)" },
  te: { code: "te", name: "Telugu", label: "Telugu 🇮🇳 (తెలుగు)" },
  es: { code: "es", name: "Spanish", label: "Spanish 🇪🇸 (Español)" },
  fr: { code: "fr", name: "French", label: "French 🇫🇷 (Français)" },
  de: { code: "de", name: "German", label: "German 🇩🇪 (Deutsch)" },
  ja: { code: "ja", name: "Japanese", label: "Japanese 🇯🇵 (日本語)" }
};

export function getAppLanguage() {
  try {
    const code = localStorage.getItem("aida_lang") || "en";
    if (SUPPORTED_LANGUAGES[code]) return SUPPORTED_LANGUAGES[code];
  } catch (e) {}
  return SUPPORTED_LANGUAGES.en;
}

export default function LanguageTranslator({ onLanguageChange }) {
  const [activeCode, setActiveCode] = useState(() => {
    return localStorage.getItem("aida_lang") || "en";
  });

  const handleChange = (e) => {
    const code = e.target.value;
    setActiveCode(code);
    localStorage.setItem("aida_lang", code);
    const langObj = SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.en;
    if (onLanguageChange) onLanguageChange(langObj);
    window.dispatchEvent(new Event("aida_language_change"));
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary, #6B7280)", textTransform: "uppercase" }}>
        🌐 Language:
      </span>
      <select
        value={activeCode}
        onChange={handleChange}
        style={{
          padding: "4px 8px",
          borderRadius: 8,
          border: "1px solid #D1D5DB",
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: "#FFF",
          color: "#374151",
          cursor: "pointer"
        }}
      >
        {Object.values(SUPPORTED_LANGUAGES).map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
