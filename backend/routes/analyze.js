import { Router } from "express";
import pool from "../db.js";

const router = Router();

const MAX_TEXT_LENGTH = 20000; // guard against oversized payloads
const MODEL = "claude-sonnet-4-6";

// Pricing is intentionally NOT hardcoded here — model pricing changes over
// time and this codebase has no way to verify current rates against
// Anthropic's live pricing page. Set these from backend/.env (see
// .env.example) after checking https://www.anthropic.com/pricing yourself.
// Left unset, estimated_cost is simply stored as 0 — token counts (the
// part we're actually certain about) are still tracked accurately either way.
function estimateCost(inputTokens, outputTokens) {
  const inputRate = Number(process.env.CLAUDE_INPUT_COST_PER_MTOK);
  const outputRate = Number(process.env.CLAUDE_OUTPUT_COST_PER_MTOK);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate)) return 0;
  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
}

async function recordUsage({ companyId, userId, datasetId, requestType, inputTokens, outputTokens }) {
  const totalTokens = inputTokens + outputTokens;
  const estimatedCost = estimateCost(inputTokens, outputTokens);
  try {
    await pool.query(
      `INSERT INTO ai_usage
         (company_id, user_id, dataset_id, request_type, input_tokens, output_tokens, total_tokens, estimated_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [companyId, userId, datasetId, requestType, inputTokens, outputTokens, totalTokens, estimatedCost]
    );
  } catch (err) {
    // Usage tracking is observability, not core functionality — a failed
    // insert here should never be the reason a user doesn't get their
    // analysis. Log it and move on.
    console.error("Failed to record AI usage:", err);
  }
}

router.post("/", async (req, res) => {
  const { system, userText, requestType, datasetId } = req.body || {};

  if (typeof system !== "string" || typeof userText !== "string") {
    return res.status(400).json({ error: "Both 'system' and 'userText' are required strings." });
  }
  if (system.length > MAX_TEXT_LENGTH || userText.length > MAX_TEXT_LENGTH) {
    return res.status(413).json({ error: "Request payload too large." });
  }
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error("Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is set on the server.");
    return res.status(500).json({ error: "Server is not configured with an AI API key." });
  }

  // datasetId is client-supplied and only used for a nullable, informational
  // label on the usage row — never used in a WHERE clause or to gate access
  // to anything, so there's no need to verify it belongs to this company.
  const safeDatasetId = Number.isInteger(datasetId) ? datasetId : null;
  const safeRequestType = typeof requestType === "string" && requestType.trim() ? requestType.trim().slice(0, 60) : "unknown";

  try {
    let text = "";
    let inputTokens = 0;
    let outputTokens = 0;

    if (process.env.GEMINI_API_KEY) {
      // Use Gemini API (Free Tier available)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userText }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`Gemini API error (company ${req.user.companyId}):`, response.status, errBody);
        return res.status(502).json({ error: "Upstream AI provider error." });
      }

      const data = await response.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      inputTokens = data.usageMetadata?.promptTokenCount || 0;
      outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
    } else {
      // Use Anthropic Claude API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          system,
          messages: [{ role: "user", content: userText }]
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error(`Anthropic API error (company ${req.user.companyId}):`, response.status, errBody);
        return res.status(502).json({ error: "Upstream AI provider error." });
      }

      const data = await response.json();
      text = (data.content || []).map(b => b.text || "").join("\n");
      const usage = data.usage || {};
      inputTokens = usage.input_tokens || 0;
      outputTokens = usage.output_tokens || 0;
    }

    // Record usage only after we know the call actually succeeded — a
    // failed request should never show up as completed usage. Awaited
    // (not fire-and-forget): the insert itself is fast relative to the
    // API call that already happened, and the whole point of this
    // table is to be a reliable usage/billing record.
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: safeDatasetId,
      requestType: safeRequestType,
      inputTokens,
      outputTokens
    });

    console.log(`[AI Response] Type: ${safeRequestType}, Text:`, text);

    return res.json({ text });
  } catch (err) {
    console.error("Error calling Anthropic API:", err);
    return res.status(500).json({ error: "Failed to reach the AI provider." });
  }
});

export default router;
