import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Compute simple SHA-256 equivalent hash string for client-side raw dataset immutability verification.
 */
export async function computeDatasetHash(contentString) {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(contentString);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return "sha256-" + hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
    }
  } catch (e) {
    console.warn("Crypto API fallback:", e);
  }
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "sha256-fallback-" + Math.abs(hash).toString(16);
}

/**
 * Universal client-side file parser for CSV, XLSX, XLS, TSV, JSON, and TXT files.
 */
export async function parseDatasetFile(file) {
  const fileName = file.name;
  const ext = fileName.split(".").pop().toLowerCase();

  if (ext === "csv" || ext === "tsv") {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => (h ? h.replace(/^\uFEFF/, "").trim() : ""),
        complete: async (res) => {
          let rows = (res.data || []).filter(r => r && typeof r === "object" && Object.keys(r).some(k => r[k] !== null && r[k] !== undefined && String(r[k]).trim() !== ""));
          let columns = (res.meta.fields || []).map(f => (f ? f.replace(/^\uFEFF/, "").trim() : "")).filter(Boolean);
          if (columns.length === 0 && rows.length > 0) {
            columns = Object.keys(rows[0]).filter(k => k && !k.startsWith("__"));
          }
          const rawHash = await computeDatasetHash(JSON.stringify(rows));
          resolve({ fileName, rows, columns, rawHash, fileType: ext, size: file.size });
        },
        error: (err) => reject(err)
      });
    });
  }

  if (ext === "json") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          let rows = [];
          let columns = [];
          if (Array.isArray(parsed)) {
            rows = parsed;
            columns = parsed.length ? Object.keys(parsed[0]) : [];
          } else if (typeof parsed === "object" && parsed !== null) {
            rows = [parsed];
            columns = Object.keys(parsed);
          }
          const rawHash = await computeDatasetHash(e.target.result);
          resolve({ fileName, rows, columns, rawHash, fileType: "json", size: file.size });
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = new Uint8Array(e.target.result);
          const workbook = XLSX.read(buffer, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          const columns = rows.length ? Object.keys(rows[0]).filter(k => k && !k.startsWith("__")) : [];
          const rawHash = await computeDatasetHash(JSON.stringify(rows));
          resolve({ fileName, rows, columns, rawHash, fileType: ext, size: file.size });
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  if (ext === "html" || ext === "htm") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawHtml = String(e.target.result || "");
          // Safe HTML parsing: strip script, link, and resource-loading elements
          const sanitizedHtml = rawHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<link\b[^>]*>/gi, "")
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
            .replace(/<embed\b[^>]*>/gi, "")
            .replace(/<img\b[^>]*>/gi, "")
            .replace(/\son\w+=(["']).*?\1/gi, "");

          const parser = new DOMParser();
          const doc = parser.parseFromString(sanitizedHtml, "text/html");
          const tableEls = Array.from(doc.querySelectorAll("table"));
          const candidateTables = [];

          tableEls.forEach((tbl, tIdx) => {
            const trs = Array.from(tbl.querySelectorAll("tr"));
            if (trs.length >= 2) {
              const headerEls = Array.from(trs[0].querySelectorAll("th, td"));
              const cols = headerEls.map((h, i) => (h.textContent || "").trim() || `Column_${i + 1}`);
              const rows = [];
              for (let r = 1; r < trs.length; r++) {
                const cells = Array.from(trs[r].querySelectorAll("td, th"));
                if (!cells.length) continue;
                const row = {};
                cols.forEach((col, idx) => {
                  row[col] = cells[idx] ? (cells[idx].textContent || "").trim() : "";
                });
                rows.push(row);
              }
              if (rows.length > 0) {
                const tableName = tbl.querySelector("caption")?.textContent?.trim() ||
                  tbl.getAttribute("id") ||
                  tbl.getAttribute("title") ||
                  `Table ${tIdx + 1} (${rows.length} rows, ${cols.length} cols)`;
                candidateTables.push({
                  index: tIdx,
                  name: tableName,
                  columns: cols,
                  rows,
                  rowCount: rows.length,
                  colCount: cols.length
                });
              }
            }
          });

          const rawHash = await computeDatasetHash(JSON.stringify(candidateTables[0]?.rows || sanitizedHtml));

          if (candidateTables.length === 0) {
            resolve({ fileName, rows: [], columns: [], rawHash, fileType: "html", size: file.size, isRawText: true, rawText: sanitizedHtml, noTableDetected: true });
          } else if (candidateTables.length === 1) {
            resolve({
              fileName,
              rows: candidateTables[0].rows,
              columns: candidateTables[0].columns,
              rawHash,
              fileType: "html",
              size: file.size,
              tables: candidateTables,
              selectedTableIndex: 0
            });
          } else {
            resolve({
              fileName,
              rows: candidateTables[0].rows,
              columns: candidateTables[0].columns,
              rawHash,
              fileType: "html",
              size: file.size,
              tables: candidateTables,
              selectedTableIndex: 0,
              hasMultipleTables: true
            });
          }
        } catch (err) {
          const rawHash = await computeDatasetHash(e.target.result);
          resolve({ fileName, rows: [], columns: [], rawHash, fileType: "html", size: file.size, isRawText: true, rawText: e.target.result, noTableDetected: true });
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Text fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rawHash = await computeDatasetHash(text);
      resolve({ fileName, rows: [], columns: [], rawHash, fileType: ext, size: file.size, isRawText: true, rawText: text });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
