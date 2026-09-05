/**
 * Identifies if a column is a unique identifier (e.g., Code, ID, UUID, Name)
 * to prevent data leakage in ML model training and target recommendations.
 */
export function isIdentifierColumn(colName, rows = []) {
  if (!colName) return true;

  const nameLower = String(colName).toLowerCase().trim();
  const idPatterns = [/^(id|code|uuid|guid|sku|ref|token|hash|key|name|index)$/i, /(_id|_code|_uuid|_key|_sku)$/i];

  if (idPatterns.some(pattern => pattern.test(nameLower))) {
    return true;
  }

  if (Array.isArray(rows) && rows.length > 5) {
    const uniqueValues = new Set(rows.map(r => String(r[colName] ?? "")));
    const ratio = uniqueValues.size / rows.length;
    if (ratio > 0.85) {
      return true;
    }
  }

  return false;
}
