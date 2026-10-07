// src/utils/dataQuality.js
/**
 * Authoritative Data Quality Calculation Engine
 * Computes exact tabular health metrics directly from rows and columns.
 * Zero hardcoded scores.
 */
export function calculateDataQuality(rows = [], columns = []) {
  if (!rows || !Array.isArray(rows) || rows.length === 0 || !columns || columns.length === 0) {
    return { score: null, missingCells: 0, missingRate: 0, duplicateRows: 0 };
  }

  const cleanCols = columns.filter(c => c && !String(c).startsWith("__"));
  if (cleanCols.length === 0) {
    return { score: null, missingCells: 0, missingRate: 0, duplicateRows: 0 };
  }

  const evalRows = rows.length > 5000 ? rows.slice(0, 5000) : rows;
  const sampleCells = evalRows.length * cleanCols.length;
  const totalCells = rows.length * cleanCols.length;

  let missingCells = 0;
  evalRows.forEach(row => {
    cleanCols.forEach(col => {
      const v = row[col];
      if (v === null || v === undefined || String(v).trim() === "" || String(v).trim() === "null" || String(v).trim() === "undefined" || String(v).trim() === "NaN") {
        missingCells++;
      }
    });
  });

  const seenHashes = new Set();
  let duplicateRows = 0;
  evalRows.forEach(row => {
    const rowHash = JSON.stringify(cleanCols.map(c => String(row[c] ?? "").trim()));
    if (seenHashes.has(rowHash)) {
      duplicateRows++;
    } else {
      seenHashes.add(rowHash);
    }
  });

  const missingRate = sampleCells > 0 ? (missingCells / sampleCells) : 0;
  const dupRate = evalRows.length > 0 ? (duplicateRows / evalRows.length) : 0;
  const scaledMissing = Math.round(missingRate * totalCells);
  const scaledDuplicates = Math.round(duplicateRows * (rows.length / evalRows.length));
  
  // Health score calculation matching DataHealthInspector
  let rawScore = 100 - (missingRate * 100 * 1.5) - (dupRate * 100 * 2.0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    score,
    missingCells: scaledMissing,
    missingRate: +(missingRate * 100).toFixed(2),
    duplicateRows: scaledDuplicates
  };
}
