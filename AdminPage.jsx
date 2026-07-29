import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import * as api from "./api";

const card = { background: "#fff", border: "1px solid #E4E0D8", borderRadius: 10, padding: 16 };
const label = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A8580" };
const th = { textAlign: "left", fontSize: 11.5, color: "#8A8580", fontWeight: 600, padding: "6px 10px", borderBottom: "1px solid #EAE7E0" };
const td = { fontSize: 13, color: "#2B2A27", padding: "8px 10px", borderBottom: "1px solid #F0EEE9" };

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCost(cost) {
  return `$${Number(cost || 0).toFixed(4)}`;
}

export default function AdminPage({ currentUserEmail, onBack }) {
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([api.getAdminSummary(), api.getAdminMembers(), api.getAdminDatasets(), api.getAdminUsage()])
      .then(([summaryRes, membersRes, datasetsRes, usageRes]) => {
        setSummary(summaryRes?.summary || null);
        setMembers(membersRes?.members || []);
        setDatasets(datasetsRes?.datasets || []);
        setUsage(usageRes?.usage || null);
      })
      .catch(err => setError(err.message || "Could not load admin data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.email} from the company?`)) return;
    try {
      await api.removeMember(member.id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
      setSummary(prev => prev ? { ...prev, memberCount: prev.memberCount - 1 } : prev);
    } catch (err) {
      alert(err.message || "Could not remove member.");
    }
  };

  const handleToggleRole = async (member) => {
    const nextRole = member.role === "admin" ? "member" : "admin";
    const verb = nextRole === "admin" ? "Promote" : "Demote";
    if (!window.confirm(`${verb} ${member.email} to ${nextRole}?`)) return;
    try {
      await api.updateMemberRole(member.id, nextRole);
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: nextRole } : m));
    } catch (err) {
      alert(err.message || "Could not change role.");
    }
  };

  const chartData = (usage?.byDay || []).map(d => ({ ...d, label: formatShortDate(d.date) }));
  const byUser = usage?.byUser || [];
  const byDataset = usage?.byDataset || [];
  const costUnconfigured = usage && usage.totalRequests > 0 && usage.estimatedCost === 0;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#2B2A27" }}>Admin Dashboard</div>
        <button onClick={onBack}
          style={{ fontSize: 12, fontWeight: 600, color: "#2B2A27", background: "#F7F5F0", border: "1px solid #E4E0D8", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>
          ← Back to dashboard
        </button>
      </div>

      {error && (
        <div style={{ ...card, marginBottom: 14, color: "#B85C5C", fontSize: 13 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: "#8A8580", fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={card}>
              <div style={label}>Team members</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{summary?.memberCount ?? "—"}</div>
            </div>
            <div style={card}>
              <div style={label}>Datasets uploaded</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{summary?.datasetCount ?? "—"}</div>
            </div>
            <div style={card}>
              <div style={label}>Rows analyzed</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{summary?.totalRowsAnalyzed?.toLocaleString() ?? "—"}</div>
            </div>
          </div>

          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2B2A27", marginBottom: 10 }}>AI usage</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            <div style={card}>
              <div style={label}>AI requests</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{usage?.totalRequests?.toLocaleString() ?? "—"}</div>
            </div>
            <div style={card}>
              <div style={label}>Total tokens</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{usage?.totalTokens?.toLocaleString() ?? "—"}</div>
            </div>
            <div style={card}>
              <div style={label}>Estimated cost</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{usage ? formatCost(usage.estimatedCost) : "—"}</div>
            </div>
          </div>
          {costUnconfigured && (
            <div style={{ fontSize: 11.5, color: "#A6A196", marginBottom: 14 }}>
              Cost shows $0.00 because per-token pricing isn't configured on the backend yet
              (see backend/.env.example &gt; CLAUDE_INPUT_COST_PER_MTOK / CLAUDE_OUTPUT_COST_PER_MTOK).
              Token counts above are accurate regardless.
            </div>
          )}

          {chartData.length > 0 && (
            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 8 }}>Requests over the last 14 days</div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A8580" }} axisLine={{ stroke: "#EAE7E0" }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8A8580" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4E0D8" }} />
                    <Bar dataKey="requests" fill="#8FA98F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 8 }}>Usage by user</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Email</th>
                    <th style={th}>Requests</th>
                    <th style={th}>Tokens</th>
                    <th style={th}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {byUser.map((u, i) => (
                    <tr key={i}>
                      <td style={td}>{u.email}</td>
                      <td style={td}>{u.requests.toLocaleString()}</td>
                      <td style={td}>{u.tokens.toLocaleString()}</td>
                      <td style={td}>{formatCost(u.cost)}</td>
                    </tr>
                  ))}
                  {byUser.length === 0 && (
                    <tr><td style={td} colSpan={4}>No AI usage yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={card}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 8 }}>Usage by dataset</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Dataset</th>
                    <th style={th}>Requests</th>
                    <th style={th}>Tokens</th>
                    <th style={th}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {byDataset.map((d, i) => (
                    <tr key={i}>
                      <td style={td}>{d.name}</td>
                      <td style={td}>{d.requests.toLocaleString()}</td>
                      <td style={td}>{d.tokens.toLocaleString()}</td>
                      <td style={td}>{formatCost(d.cost)}</td>
                    </tr>
                  ))}
                  {byDataset.length === 0 && (
                    <tr><td style={td} colSpan={4}>No AI usage yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2B2A27", marginBottom: 2 }}>Team members</div>
            <div style={{ fontSize: 11.5, color: "#A6A196", marginBottom: 10 }}>
              Role changes take effect the next time that person logs in.
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Email</th>
                  <th style={th}>Role</th>
                  <th style={th}>Joined</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td style={td}>{m.email}{m.email === currentUserEmail ? " (you)" : ""}</td>
                    <td style={td}>{m.role}</td>
                    <td style={td}>{formatDate(m.createdAt)}</td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      {m.email !== currentUserEmail && (
                        <>
                          <button onClick={() => handleToggleRole(m)}
                            style={{ fontSize: 11.5, color: "#3E6F8E", background: "none", border: "1px solid #C9D9E4", borderRadius: 6, padding: "4px 9px", cursor: "pointer", marginRight: 6 }}>
                            {m.role === "admin" ? "Demote" : "Promote"}
                          </button>
                          <button onClick={() => handleRemove(m)}
                            style={{ fontSize: 11.5, color: "#B85C5C", background: "none", border: "1px solid #E4C9C9", borderRadius: 6, padding: "4px 9px", cursor: "pointer" }}>
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td style={td} colSpan={4}>No members found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2B2A27", marginBottom: 10 }}>Company datasets</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Name</th>
                  <th style={th}>Rows</th>
                  <th style={th}>Quality</th>
                  <th style={th}>Uploaded by</th>
                  <th style={th}>Last updated</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map(d => (
                  <tr key={d.id}>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{d.rowCount.toLocaleString()}</td>
                    <td style={td}>{d.qualityScore != null ? `${d.qualityScore}%` : "—"}</td>
                    <td style={td}>{d.createdByEmail}</td>
                    <td style={td}>{formatDate(d.updatedAt)}</td>
                  </tr>
                ))}
                {datasets.length === 0 && (
                  <tr><td style={td} colSpan={5}>No datasets uploaded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
