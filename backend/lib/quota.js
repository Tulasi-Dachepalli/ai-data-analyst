import pool from "../db.js";

export const TOKEN_QUOTA_LIMIT = Number(process.env.TOKEN_QUOTA_LIMIT) || 50000;
export const TOKEN_QUOTA_WINDOW_HOURS = Number(process.env.TOKEN_QUOTA_WINDOW_HOURS) || 3;
export const PRO_QUOTA_WINDOW_HOURS = Number(process.env.PRO_QUOTA_WINDOW_HOURS) || 1;

/**
 * Computes the next reset time in UTC when usage falls back below the limit.
 * Walks the records ASC, summing tokens, and finds the timestamp `t`
 * where (usedTokens - cumulativeSum) < limit. Returns `t + windowHours`.
 * If already under limit or no records, returns null.
 * 
 * @param {Array} records - Usage records sorted by created_at ASC
 * @param {number} usedTokens - Total active tokens consumed in the window
 * @param {number} limit - Token limit threshold
 * @param {number} windowHours - Rolling window size in hours
 * @returns {Date|null}
 */
export function computeResetTime(records, usedTokens, limit = TOKEN_QUOTA_LIMIT, windowHours = TOKEN_QUOTA_WINDOW_HOURS) {
  if (usedTokens < limit || records.length === 0) {
    return null;
  }
  
  let cumulativeSum = 0;
  for (const record of records) {
    cumulativeSum += Number(record.total_tokens || record.tokens || 0);
    if (usedTokens - cumulativeSum < limit) {
      const oldestRecordDate = new Date(record.created_at || record.day || Date.now());
      return new Date(oldestRecordDate.getTime() + windowHours * 60 * 60 * 1000);
    }
  }
  
  // Fallback to the latest record's time + window hours
  const latestRecordDate = new Date(records[records.length - 1].created_at || Date.now());
  return new Date(latestRecordDate.getTime() + windowHours * 60 * 60 * 1000);
}

/**
 * Estimates token cost based on rates configured in env.
 */
export function estimateCost(inputTokens, outputTokens) {
  const inputRate = Number(process.env.CLAUDE_INPUT_COST_PER_MTOK);
  const outputRate = Number(process.env.CLAUDE_OUTPUT_COST_PER_MTOK);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate)) return 0;
  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
}

/**
 * Records token usage atomically in the database.
 */
export async function recordUsage({ companyId, userId, datasetId, requestType, inputTokens = 0, outputTokens = 0, totalTokens = 0 }) {
  const finalTotal = totalTokens || (inputTokens + outputTokens);
  const estimatedCost = estimateCost(inputTokens, outputTokens);
  try {
    await pool.query(
      `INSERT INTO ai_usage
         (company_id, user_id, dataset_id, request_type, input_tokens, output_tokens, total_tokens, estimated_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [companyId, userId, datasetId, requestType, inputTokens, outputTokens, finalTotal, estimatedCost]
    );
  } catch (err) {
    // Non-blocking query logging failure
    console.error("Failed to record AI usage:", err);
  }
}
