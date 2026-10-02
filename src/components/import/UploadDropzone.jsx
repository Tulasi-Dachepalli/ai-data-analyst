// src/components/import/UploadDropzone.jsx
import React, { useState } from "react";

export default function UploadDropzone({ onFileSelected }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? "#2563EB" : "#CBD5E1"}`,
        borderRadius: 14,
        padding: "36px 24px",
        textAlign: "center",
        backgroundColor: isDragging ? "#EFF6FF" : "#F8FAFC",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        cursor: "pointer"
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        boxShadow: "0 4px 12px rgba(37,99,235,0.2)"
      }}>
        📁
      </div>

      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
          Drop your dataset file here or click to browse
        </div>
        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
          Maximum file size: 100 MB • All datasets stored as immutable raw versions
        </div>
      </div>

      {/* Format Badges */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
        {["CSV", "XLSX", "XLS", "JSON", "Parquet", "TXT"].map(fmt => (
          <span key={fmt} style={{
            fontSize: 11,
            fontWeight: 700,
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            color: "#475569",
            padding: "3px 8px",
            borderRadius: 6
          }}>
            {fmt}
          </span>
        ))}
      </div>

      <label style={{
        marginTop: 8,
        background: "#0F172A",
        color: "#FFFFFF",
        padding: "9px 20px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-block"
      }}>
        📁 Browse Files
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.json,.parquet,.txt"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}
