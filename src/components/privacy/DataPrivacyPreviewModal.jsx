// src/components/privacy/DataPrivacyPreviewModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { scanDatasetForPII, generateMaskedValue, SENSITIVITY_TYPES } from "../../utils/piiSanitizer";

export default function DataPrivacyPreviewModal({ isOpen, onClose, columns = [], rows = [], onApplyMasking }) {
  const [findings, setFindings] = useState([]);
  const [rules, setRules] = useState({});
  const [revealRaw, setRevealRaw] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  // Scan dataset whenever columns or rows change
  useEffect(() => {
    if (!columns || columns.length === 0) {
      setFindings([]);
      setRules({});
      return;
    }

    const detected = scanDatasetForPII(columns, rows);
    setFindings(detected);

    // Initialize default recommended rules from existing storage or detection
    const savedRules = JSON.parse(localStorage.getItem("aida_privacy_rules") || "{}");
    const initialRules = {};
    detected.forEach(item => {
      initialRules[item.column] = savedRules[item.column] || item.strategy || "redact";
    });
    setRules(initialRules);
  }, [columns, rows]);

  const handleStrategyChange = (col, strat) => {
    setRules(prev => ({ ...prev, [col]: strat }));
  };

  const handleProtectAll = () => {
    const updated = {};
    findings.forEach(item => {
      updated[item.column] = item.type.defaultStrategy || "redact";
    });
    setRules(updated);
    saveAndApply(updated);
  };

  const saveAndApply = (currentRules = rules) => {
    localStorage.setItem("aida_privacy_rules", JSON.stringify(currentRules));
    const count = Object.values(currentRules).filter(s => s !== "keep").length;
    setAppliedCount(count);

    if (onApplyMasking) {
      onApplyMasking(currentRules);
    }
    window.dispatchEvent(new CustomEvent("aida_privacy_updated", { detail: { rules: currentRules, maskedCount: count } }));
    if (onClose) onClose();
  };

  const riskSummary = useMemo(() => {
    if (findings.length === 0) return { label: "Zero PII Detected (Safe)", color: "#166534", bg: "#DCFCE7", level: "safe" };
    const hasCritical = findings.some(f => f.type.risk === "critical");
    const hasHigh = findings.some(f => f.type.risk === "high");
    if (hasCritical) return { label: "Critical Financial / ID Exposure", color: "#991B1B", bg: "#FEE2E2", level: "critical" };
    if (hasHigh) return { label: "High Sensitivity PII Detected", color: "#9A3412", bg: "#FFEDD5", level: "high" };
    return { label: "Medium Sensitivity Fields", color: "#854D0E", bg: "#FEF9C3", level: "medium" };
  }, [findings]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        width: 820,
        maxWidth: "100%",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: "1px solid #E2E8F0",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#F8FAFC"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20
            }}>
              🛡️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
                  Data Privacy & PII Protection Studio
                </h3>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: riskSummary.bg,
                  color: riskSummary.color
                }}>
                  {riskSummary.label}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748B" }}>
                OWASP LLM-06 Compliant • Mask sensitive records before external AI or statistical dispatch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#94A3B8",
              cursor: "pointer",
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Quick Metrics Bar */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Total Columns Scanned</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{columns.length} columns</div>
            </div>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>PII / Sensitive Flagged</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: findings.length > 0 ? "#DC2626" : "#059669", marginTop: 2 }}>
                {findings.length} fields
              </div>
            </div>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>AI Privacy Shield Status</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginTop: 4 }}>
                Active (Non-Destructive Masking)
              </div>
            </div>
          </div>

          {/* Finding Table or Clean Banner */}
          {findings.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 12
            }}>
              <span style={{ fontSize: 36 }}>✅</span>
              <h4 style={{ margin: "10px 0 4px", fontSize: 15, fontWeight: 700, color: "#166534" }}>
                No PII or Sensitive Columns Detected
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: "#15803D" }}>
                Your dataset appears clean of emails, phone numbers, individual compensation records, and government identification numbers.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#334155" }}>
                  Review & Configure Masking Rules for Identified Columns:
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={revealRaw}
                    onChange={e => setRevealRaw(e.target.checked)}
                  />
                  <span>Reveal Sample Values</span>
                </label>
              </div>

              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Column Name</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Detected Type</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Raw Sample</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Masked AI Preview</th>
                      <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: "#475569" }}>Masking Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map(item => {
                      const currentStrategy = rules[item.column] || "redact";
                      const previewMask = generateMaskedValue(item.sampleRaw, currentStrategy, item.type, 1);

                      return (
                        <tr key={item.column} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0F172A" }}>
                            {item.column}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: item.type.risk === "critical" ? "#FEE2E2" : item.type.risk === "high" ? "#FFEDD5" : "#FEF3C7",
                              color: item.type.risk === "critical" ? "#991B1B" : item.type.risk === "high" ? "#9A3412" : "#92400E",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700
                            }}>
                              <span>{item.type.icon}</span>
                              <span>{item.type.label}</span>
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748B", fontFamily: "monospace" }}>
                            {revealRaw ? String(item.sampleRaw) : "••••••••••••"}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#2563EB", fontFamily: "monospace", fontWeight: 600 }}>
                            {String(previewMask)}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <select
                              value={currentStrategy}
                              onChange={e => handleStrategyChange(item.column, e.target.value)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 6,
                                border: "1px solid #CBD5E1",
                                fontSize: 12,
                                fontWeight: 600,
                                background: "#FFFFFF",
                                color: "#0F172A",
                                cursor: "pointer",
                                outline: "none"
                              }}
                            >
                              <option value="redact">🔒 Redact [CONFIDENTIAL]</option>
                              <option value="hash">🔑 Hash (SHA-256)</option>
                              <option value="range">📊 Range Binning ($50k-$75k)</option>
                              <option value="anonymize">👤 Anonymize (Subject-1)</option>
                              <option value="exclude">🚫 Exclude from AI Context</option>
                              <option value="keep">⚠️ Keep Visible (Unmasked)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#F8FAFC"
        }}>
          <div style={{ fontSize: 12, color: "#64748B" }}>
            🔒 Data transformations apply non-destructively without modifying your raw uploaded file.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {findings.length > 0 && (
              <button
                onClick={handleProtectAll}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ⚡ Quick Protect All
              </button>
            )}

            <button
              onClick={() => saveAndApply()}
              style={{
                padding: "9px 20px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #0F172A 0%, #2563EB 100%)",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.25)"
              }}
            >
              Apply Privacy Protection & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
