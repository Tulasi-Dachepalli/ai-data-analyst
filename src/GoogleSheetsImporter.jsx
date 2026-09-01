import React, { useState } from "react";
import Papa from "papaparse";

export function extractGoogleSheetCsvUrl(url) {
  if (!url || typeof url !== "string") return null;
  
  // Extract Sheet ID
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) return null;
  
  const sheetId = match[1];
  
  // Extract GID if present
  const gidMatch = url.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  let exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (gid) {
    exportUrl += `&gid=${gid}`;
  }
  return exportUrl;
}

export default function GoogleSheetsImporter({ isOpen, onClose, onImportSuccess }) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleImport = async (e) => {
    e.preventDefault();
    setError("");

    const csvUrl = extractGoogleSheetCsvUrl(sheetUrl);
    if (!csvUrl) {
      setError("Invalid Google Sheets link. Please paste a valid Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/.../edit).");
      return;
    }

    setLoading(true);

    try {
      // Fetch CSV content from Google Sheets export URL
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("Could not access Google Sheet. Please ensure the link is set to 'Anyone with the link can view'.");
      }

      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            setError("The Google Sheet appears to be empty.");
            setLoading(false);
            return;
          }

          const columns = results.meta.fields || Object.keys(results.data[0] || {});
          const fileName = `GoogleSheet_${new Date().toISOString().slice(0, 10)}.csv`;

          onImportSuccess({
            name: fileName,
            rows: results.data,
            columns: columns,
            googleSheetUrl: sheetUrl,
            csvExportUrl: csvUrl
          });

          setLoading(false);
          onClose();
        },
        error: (err) => {
          setError("Failed to parse Google Sheet data: " + err.message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err.message || "Failed to fetch Google Sheet.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div style={{
        backgroundColor: "#FFF", borderRadius: 16, border: "1px solid #EAE7E0",
        maxWidth: 520, width: "100%", padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        fontFamily: "var(--font-sans, sans-serif)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
            🔗 Import & Sync Google Sheet
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#8A8580" }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginTop: 0, marginBottom: 16 }}>
          Paste any Google Sheets link to import rows and auto-build your BI dashboard.
        </p>

        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: "#166534" }}>
          💡 <strong>Tip</strong>: Make sure your Google Sheet sharing setting is set to <strong>"Anyone with the link can view"</strong>.
        </div>

        <form onSubmit={handleImport}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Google Sheets Share URL:
            </label>
            <input
              type="text"
              required
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgm..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid #D1D5DB", fontSize: 13, boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: 10, fontSize: 12, color: "#991B1B", marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#FFF", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !sheetUrl.trim()}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: loading ? "#9CA3AF" : "#10B981", color: "#FFF",
                fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              {loading ? "Importing Sheet..." : "🔗 Import & Build Dashboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
