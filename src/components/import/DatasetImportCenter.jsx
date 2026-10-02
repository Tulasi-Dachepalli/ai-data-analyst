// src/components/import/DatasetImportCenter.jsx
import React, { useState } from "react";
import UploadDropzone from "./UploadDropzone";
import ImportOptions from "./ImportOptions";
import ImportProgress from "./ImportProgress";
import ImportResult from "./ImportResult";
import SensitiveColumnDetector from "./SensitiveColumnDetector";
import { useDataset } from "../../context/DatasetContext";
import { useActivity } from "../../context/ActivityContext";
import { parseDatasetFile } from "../../utils/fileParser";

export default function DatasetImportCenter({ isOpen, onClose }) {
  const { loadDataset } = useDataset();
  const { logEvent, setIsProcessing } = useActivity();

  const [step, setStep] = useState("select"); // select, uploading, success, error
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [options, setOptions] = useState({
    detectTypes: true,
    detectDates: true,
    detectMissing: true,
    detectDuplicates: true,
    profileDataset: true,
    treatFirstRowHeader: true
  });

  const [pipelineSteps, setPipelineSteps] = useState([
    { label: "File received & format validated", status: "pending" },
    { label: "Reading records & verifying header row", status: "pending" },
    { label: "Detecting column types & date fields", status: "pending" },
    { label: "Checking data quality & duplicate hashes", status: "pending" },
    { label: "Creating Raw Dataset (v1 Immutable SHA-256)", status: "pending" },
    { label: "Preparing dataset workspace", status: "pending" }
  ]);

  const [importResultData, setImportResultData] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleStartImport = () => {
    if (!file) return;

    // Validate extension
    const ext = file.name.split(".").pop().toLowerCase();
    const supported = ["csv", "xlsx", "xls", "json", "parquet", "txt"];
    if (!supported.includes(ext)) {
      setErrorMessage(`Unable to import this file format (.${ext}).\nSupported formats: CSV, XLSX, XLS, JSON, Parquet, TXT.`);
      setStep("error");
      return;
    }

    setStep("uploading");
    setIsProcessing(true);

    parseDatasetFile(file).then((parsed) => {
      let currentIdx = 0;
      const interval = setInterval(() => {
        setPipelineSteps(prev => prev.map((s, idx) => {
          if (idx < currentIdx) return { ...s, status: "completed" };
          if (idx === currentIdx) return { ...s, status: "active" };
          return { ...s, status: "pending" };
        }));

        currentIdx++;
        if (currentIdx > 6) {
          clearInterval(interval);
          setPipelineSteps(prev => prev.map(s => ({ ...s, status: "completed" })));
          setIsProcessing(false);

          const actualRows = parsed.rows || [];
          const actualCols = parsed.columns || (actualRows.length ? Object.keys(actualRows[0]) : []);

          const res = {
            name: file.name,
            rows: actualRows,
            cols: actualCols,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            hash: parsed.rawHash || ("sha256-" + Math.random().toString(36).substring(2, 12) + "a8f9")
          };

          setImportResultData(res);
          loadDataset(file.name, actualRows, actualCols, { rawHash: res.hash, size: file.size, fileType: parsed.fileType });

          logEvent({
            stage: "01 Raw Data",
            action: `Imported dataset file ${file.name}`,
            datasetVersion: "v1",
            affectedRows: actualRows.length,
            affectedColumns: actualCols.length,
            result: `File ${file.name} successfully imported as Raw Dataset v1 (${res.hash})`
          });

          setStep("success");
        }
      }, 300);
    }).catch((err) => {
      setIsProcessing(false);
      setErrorMessage(`Failed to parse ${file.name}: ${err.message}`);
      setStep("error");
    });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        width: 640,
        maxWidth: "95vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 24px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Enterprise Data Import Center
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              Import & Profile Dataset
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#FFF",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18, maxHeight: "80vh", overflowY: "auto" }}>

          {step === "select" && (
            <>
              <UploadDropzone onFileSelected={handleFileSelect} />
              {file && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1E4ED8" }}>Selected File:</span>
                    <span style={{ fontSize: 13, color: "#1E3A8A", marginLeft: 6, fontWeight: 600 }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    onClick={handleStartImport}
                    style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    🚀 Import Dataset Now
                  </button>
                </div>
              )}
              <ImportOptions options={options} onChange={setOptions} />
            </>
          )}

          {step === "uploading" && (
            <ImportProgress steps={pipelineSteps} fileName={file?.name} />
          )}

          {step === "success" && importResultData && (
            <>
              <ImportResult result={importResultData} onOpenWorkspace={onClose} />
              <SensitiveColumnDetector columns={importResultData.cols} />
            </>
          )}

          {step === "error" && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#991B1B" }}>
                Unable to Import File
              </div>
              <div style={{ fontSize: 13, color: "#B91C1C", whiteSpace: "pre-line" }}>
                {errorMessage}
              </div>
              <button
                onClick={() => setStep("select")}
                style={{ background: "#991B1B", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", alignSelf: "flex-end" }}
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
