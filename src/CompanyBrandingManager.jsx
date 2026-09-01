import React, { useState, useEffect } from "react";

export function getCompanyBranding() {
  try {
    const saved = localStorage.getItem("aida_branding");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    companyName: "Acme Analytics Corp",
    subtitle: "Confidential Executive Summary & Intelligence Briefing",
    brandColor: "#3E6F8E",
    logoUrl: ""
  };
}

export default function CompanyBrandingManager({ onBrandingChange }) {
  const [branding, setBranding] = useState(getCompanyBranding);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem("aida_branding", JSON.stringify(branding));
    if (onBrandingChange) onBrandingChange(branding);
  }, [branding, onBrandingChange]);

  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setBranding(prev => ({ ...prev, logoUrl: evt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem("aida_branding", JSON.stringify(branding));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          🏢 Corporate Branding & Executive Report Header
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Customize your company logo, brand color theme, and report header title embedded in all downloadable PDF/HTML exports.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Company / Brand Name:</label>
          <input
            type="text"
            value={branding.companyName}
            onChange={e => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Report Subtitle / Header:</label>
          <input
            type="text"
            value={branding.subtitle}
            onChange={e => setBranding(prev => ({ ...prev, subtitle: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>3. Brand Accent Color:</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              value={branding.brandColor}
              onChange={e => setBranding(prev => ({ ...prev, brandColor: e.target.value }))}
              style={{ width: 40, height: 36, border: "none", borderRadius: 6, cursor: "pointer" }}
            />
            <input
              type="text"
              value={branding.brandColor}
              onChange={e => setBranding(prev => ({ ...prev, brandColor: e.target.value }))}
              style={{ width: 100, padding: "8px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, fontFamily: "monospace" }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>4. Company Logo Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ fontSize: 12, color: "#4B5563" }}
          />
        </div>
      </div>

      {/* Live Corporate Header Preview */}
      <div style={{ border: `2px dashed ${branding.brandColor}`, borderRadius: 10, padding: 20, backgroundColor: "#FAFAFA", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>
          👁️ Live Report Header Preview:
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `3px solid ${branding.brandColor}`, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" style={{ maxHeight: 44, maxWidth: 140, objectFit: "contain" }} />
            ) : (
              <div style={{ background: branding.brandColor, color: "#FFF", width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                {branding.companyName.charAt(0) || "A"}
              </div>
            )}
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: branding.brandColor }}>{branding.companyName}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{branding.subtitle}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>
            STRICTLY CONFIDENTIAL
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          style={{ backgroundColor: branding.brandColor, color: "#FFF", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          {savedSuccess ? "✅ Corporate Branding Saved!" : "💾 Save Branding Preferences"}
        </button>
      </div>
    </div>
  );
}
