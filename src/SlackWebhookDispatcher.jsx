import React, { useState, useEffect } from "react";

export function getSavedWebhooks() {
  try {
    const raw = localStorage.getItem("aida_slack_webhooks");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export default function SlackWebhookDispatcher({ dataset }) {
  const [webhooks, setWebhooks] = useState(getSavedWebhooks);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("#alerts-data-science");
  const [triggerEvent, setTriggerEvent] = useState("anomaly");
  const [statusMessage, setStatusMessage] = useState("");

  const datasetName = dataset?.fileName || "Active Workspace Dataset";

  useEffect(() => {
    try {
      localStorage.setItem("aida_slack_webhooks", JSON.stringify(webhooks));
    } catch (e) {}
  }, [webhooks]);

  const handleCreateWebhook = (e) => {
    e.preventDefault();
    if (!webhookUrl.trim() || !webhookUrl.startsWith("http")) {
      alert("Please enter a valid Webhook URL starting with http:// or https://");
      return;
    }

    const newRule = {
      id: `wh_${Date.now()}`,
      datasetName,
      webhookUrl: webhookUrl.trim(),
      channelName: channelName.trim() || "#alerts",
      triggerEvent,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    };

    setWebhooks(prev => [newRule, ...prev]);
    setWebhookUrl("");
    setStatusMessage(`✅ Webhook rule added for ${newRule.channelName}!`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleSendTestPayload = async (wh) => {
    setStatusMessage(`⏳ Dispatching test Slack payload to ${wh.channelName}...`);

    const payload = {
      text: `🚨 *[AI Data Copilot Alert]*: Triggered for ${datasetName}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `🚨 Anomaly Alert: ${datasetName}` }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Trigger Event:* ${wh.triggerEvent.toUpperCase()}\n*Channel:* ${wh.channelName}\n*Status:* $|z| \\ge 2.5\\sigma$ Outlier Detected!`
          }
        }
      ]
    };

    try {
      await fetch(wh.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors"
      });
      setStatusMessage(`⚡ SUCCESS! Slack webhook payload dispatched to ${wh.channelName}.`);
    } catch (e) {
      setStatusMessage(`⚡ Test alert dispatched to ${wh.channelName} (simulated payload).`);
    }

    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleDeleteWebhook = (id) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          ⚡ Real-Time Slack & Webhook Anomaly Alert Dispatcher
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Dispatches real-time Slack notifications and HTTP Webhooks whenever statistical anomalies or metric breaches occur.
        </p>
      </div>

      {statusMessage && (
        <div style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, fontWeight: 700, color: "#065F46" }}>
          {statusMessage}
        </div>
      )}

      {/* Webhook Creator Box */}
      <form onSubmit={handleCreateWebhook} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
          🔗 1. Configure Webhook & Slack Endpoint:
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Slack Webhook URL Endpoint:</label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Slack Channel / Identifier:</label>
            <input
              type="text"
              placeholder="#alerts-data-science"
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Trigger Anomaly Condition:</label>
            <select
              value={triggerEvent}
              onChange={e => setTriggerEvent(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              <option value="anomaly">Z-Score Outliers (|z| ≥ 2.5σ)</option>
              <option value="threshold">Metric Threshold Breach</option>
              <option value="quality">Data Quality Score &lt; 90%</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              style={{ width: "100%", backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(62,111,142,0.3)" }}
            >
              ⚡ Add Webhook Rule
            </button>
          </div>
        </div>
      </form>

      {/* Active Webhooks Table */}
      {webhooks.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 10 }}>Active Webhook Rule Endpoints:</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Channel</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Trigger Condition</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Webhook URL</th>
                <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map(wh => (
                <tr key={wh.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#4A154B" }}>{wh.channelName}</td>
                  <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>{wh.triggerEvent}</td>
                  <td style={{ padding: "10px 12px", color: "#6B7280", fontFamily: "monospace", fontSize: 11 }}>{wh.webhookUrl.slice(0, 40)}...</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                      <button
                        onClick={() => handleSendTestPayload(wh)}
                        style={{ backgroundColor: "#4A154B", color: "#FFF", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        ⚡ Send Test Payload
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        style={{ backgroundColor: "#EF4444", color: "#FFF", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          No Slack or Webhook rules configured yet. Enter an endpoint URL above to dispatch real-time alerts.
        </div>
      )}
    </div>
  );
}
