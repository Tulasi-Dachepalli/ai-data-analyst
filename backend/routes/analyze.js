import { Router } from "express";
import pool from "../db.js";
import { recordUsage } from "../lib/quota.js";
import { sanitizePromptText, deriveRestrictedColumns } from "../lib/piiSanitizer.js";

const router = Router();

const MAX_TEXT_LENGTH = 20000; // guard against oversized payloads
const MODEL = "claude-sonnet-4-6";



router.post("/", async (req, res) => {
  const { system, userText, requestType, datasetId, restrictedFields } = req.body || {};

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

  let safeDatasetId = null;
  if (datasetId !== undefined && datasetId !== null) {
    const dId = Number(datasetId);
    if (!Number.isInteger(dId)) {
      return res.status(400).json({ error: "Invalid datasetId." });
    }
    const dsCheck = await pool.query(
      "SELECT id, data_json FROM datasets WHERE id = $1 AND company_id = $2",
      [dId, req.user.companyId]
    );
    if (dsCheck.rows.length === 0) {
      return res.status(404).json({ error: "Dataset not found or access denied." });
    }
    safeDatasetId = dId;
    const datasetData = dsCheck.rows[0].data_json || {};
    const datasetCols = datasetData.columns || (datasetData.rows?.[0] ? Object.keys(datasetData.rows[0]) : []);
    var serverRestrictedCols = deriveRestrictedColumns(req.user?.role, datasetCols);
  } else {
    var serverRestrictedCols = deriveRestrictedColumns(req.user?.role, ["salary", "compensation", "wage", "payroll", "bonus", "ctc", "ssn", "bank_account"]);
  }
  const safeRequestType = typeof requestType === "string" && requestType.trim() ? requestType.trim().slice(0, 60) : "unknown";

  // Server-side RBAC restriction for MIS Analyst role
  if (req.user && req.user.role === "mis_analyst") {
    const restrictedTypes = ["clustering", "forecast", "ml_modeling"];
    if (restrictedTypes.includes(safeRequestType)) {
      return res.status(403).json({ error: "Access denied: MIS Analyst role is restricted from ML Modeling and Advanced Forecasting." });
    }
  }

  // Combine server-enforced role restrictions with any optional client supplements
  const effectiveRestrictedFields = Array.from(new Set([
    ...(serverRestrictedCols || []),
    ...(Array.isArray(restrictedFields) ? restrictedFields : [])
  ]));

  // Server-side PII and restricted field sanitization BEFORE dispatching to upstream AI provider
  const { sanitizedText: cleanSystem, redactedCount: sysRedacted } = sanitizePromptText(system, effectiveRestrictedFields);
  const { sanitizedText: cleanUserText, redactedCount: userRedacted } = sanitizePromptText(userText, effectiveRestrictedFields);
  const totalRedacted = sysRedacted + userRedacted;
  if (totalRedacted > 0) {
    console.log(`[Privacy Guard] Stripped ${totalRedacted} restricted field instances from AI payload for company ${req.user.companyId} (role: ${req.user.role || 'member'}).`);
  }

  try {
    let text = "";
    let inputTokens = 0;
    let outputTokens = 0;

    if (process.env.GEMINI_API_KEY) {
      // Use Gemini API (Free Tier available)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: cleanSystem }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: cleanUserText }]
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
          system: cleanSystem,
          messages: [{ role: "user", content: cleanUserText }]
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
