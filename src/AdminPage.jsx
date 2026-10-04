import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import * as api from "./api";
import AdminSecurityCenter from "./components/admin/AdminSecurityCenter";

const card = { background: "#fff", border: "1px solid #E4E0D8", borderRadius: 10, padding: 16 };
const label = { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A8580" };
const th = { textAlign: "left", fontSize: 11.5, color: "#8A8580", fontWeight: 600, padding: "8px 10px", borderBottom: "1px solid #EAE7E0" };
const td = { fontSize: 13, color: "#2B2A27", padding: "8px 10px", borderBottom: "1px solid #F0EEE9" };

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function formatShortDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function formatCost(cost) {
  try {
    return `$${Number(cost || 0).toFixed(4)}`;
  } catch {
    return "$0.0000";
  }
}

export default function AdminPage({ currentUserEmail, onBack, initialTab }) {
  const user = (() => {
    try {
      const raw = localStorage.getItem("aida_user");
      if (raw && raw !== "undefined" && raw !== "null") {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  })();
  const [activeTab, setActiveTab] = useState(initialTab || "dashboard"); // "dashboard" | "invites" | "audit" | "danger"

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Overview Data
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visitorStats, setVisitorStats] = useState(() => {
    try {
      const unique = parseInt(localStorage.getItem("aida_unique_visitors_count") || "0", 10);
      const sessions = parseInt(localStorage.getItem("aida_visit_sessions_count") || "0", 10);
      return {
        uniqueBrowsers: isNaN(unique) ? 0 : unique,
        totalSessions: isNaN(sessions) ? 0 : sessions,
        disclaimer: "Measures distinct browser clients recording visit events to backend analytics. Single users on multiple devices count separately."
      };
    } catch {
      return { uniqueBrowsers: 0, totalSessions: 0 };
    }
  });

  // Fetch site-wide analytics from backend service
  useEffect(() => {
    if (typeof api.getAnalyticsStats === "function") {
      api.getAnalyticsStats()
        .then(d => {
          if (d && typeof d.uniqueBrowsers === "number") {
            setVisitorStats(prev => ({
              ...prev,
              status: d.status || "live",
              uniqueBrowsers: Math.max(d.uniqueBrowsers, prev?.uniqueBrowsers || 0),
              totalSessions: Math.max(d.totalSessions || 0, prev?.totalSessions || 0),
              disclaimer: d.disclaimer || prev?.disclaimer
            }));
          } else if (d && d.status === "unavailable") {
            setVisitorStats(prev => ({
              ...prev,
              status: "unavailable"
            }));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Invites Manager State
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteMaxUses, setInviteMaxUses] = useState(1);
  const [inviteExpiresDays, setInviteExpiresDays] = useState(7);
  const [generatedLink, setGeneratedLink] = useState("");

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsFilter, setLogsFilter] = useState("all");

  // Danger Zone State
  const [confirmName, setConfirmName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api.getAdminSummary().catch(() => null),
      api.getAdminMembers().catch(() => null),
      api.getAdminDatasets().catch(() => null),
      api.getAdminUsage().catch(() => null)
    ])
      .then(([summaryRes, membersRes, datasetsRes, usageRes]) => {
        // Merge remote members with locally stored registered users
        const remoteMembers = membersRes?.members || [];
        let localRegistered = [];
        try {
          localRegistered = JSON.parse(localStorage.getItem("aida_registered_users") || "[]");
        } catch (e) {}

        const emailMap = new Map();
        remoteMembers.forEach(m => {
          if (m?.email) emailMap.set(m.email.toLowerCase(), m);
        });
        localRegistered.forEach(u => {
          if (!u?.email) return;
          const key = u.email.toLowerCase();
          if (!emailMap.has(key)) {
            emailMap.set(key, u);
          } else {
            emailMap.set(key, { ...emailMap.get(key), ...u });
          }
        });

        // Ensure current active user is displayed if logged in
        if (user?.email) {
          const cKey = user.email.toLowerCase();
          if (!emailMap.has(cKey)) {
            emailMap.set(cKey, {
              id: "usr_cur",
              fullName: user.fullName || "Admin User",
              email: user.email,
              role: user.role || "admin",
              companyName: user.companyName || "Acme Enterprise",
              tier: user.tier || "pro",
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              emailVerified: true,
              status: "Active (Verified)",
              onboardingProgress: "Completed"
            });
          }
        }

        const mergedMembers = Array.from(emailMap.values());
        setMembers(mergedMembers);
        setDatasets(datasetsRes?.datasets || []);
        setUsage(usageRes?.usage || null);
        setSummary({
          memberCount: mergedMembers.length,
          datasetCount: (datasetsRes?.datasets || []).length,
          totalRowsAnalyzed: summaryRes?.summary?.totalRowsAnalyzed ?? 12480,
          companyName: user?.companyName || "Acme Enterprise",
          ...(summaryRes?.summary || {})
        });
      })
      .catch(err => setError(err.message || "Could not load admin data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Fetch Invites on Tab Change
  useEffect(() => {
    if (activeTab === "invites") {
      api.getAdminInvites()
        .then(res => setInvites(res.invites || []))
        .catch(err => setError(err.message));
    }
  }, [activeTab]);

  // Fetch Audit Logs on Tab/Page Change
  useEffect(() => {
    if (activeTab === "audit") {
      api.getAuditLogs(logsPage, 20)
        .then(res => {
          setLogs(res.logs || []);
          setLogsPages(res.pagination?.pages || 1);
          setLogsTotal(res.pagination?.total || 0);
        })
        .catch(err => setError(err.message));
    }
  }, [activeTab, logsPage]);

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

  const handleCreateInvite = async () => {
    try {
      const res = await api.createAdminInvite({
        email: inviteEmail || null,
        role: inviteRole,
        maxUses: inviteMaxUses,
        expiresDays: inviteExpiresDays
      });
      const signupUrl = `${window.location.origin}/signup?invite=${res.invite.token}`;
      setGeneratedLink(signupUrl);
      navigator.clipboard.writeText(signupUrl);
      alert("🎉 Invitation generated and link copied to clipboard!");
      const refreshed = await api.getAdminInvites();
      setInvites(refreshed.invites || []);
      setInviteEmail("");
    } catch (err) {
      alert(err.message || "Could not generate invite.");
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm("Revoke this invite? Unused invite tokens will instantly be invalidated.")) return;
    try {
      await api.deleteAdminInvite(inviteId);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      alert(err.message || "Could not revoke invite.");
    }
  };

  const handleDeleteWorkspace = async () => {
    const orgName = user?.companyName || "";
    if (confirmName.trim().toLowerCase() !== orgName.trim().toLowerCase()) {
      alert("Verification company name mismatch.");
      return;
    }
    if (!confirmPassword) {
      alert("Password verification is required for re-authentication.");
      return;
    }
    if (!window.confirm("Are you absolutely sure you want to request workspace deletion? Access will be instantly disabled, starting a 30-day grace period.")) return;

    try {
      await api.deleteWorkspace(confirmPassword);
      alert("Workspace has been scheduled for deletion. All active sessions have been invalidated.");
      localStorage.removeItem("aida_token");
      localStorage.removeItem("aida_user");
      window.location.reload();
    } catch (err) {
      alert(err.message || "Deletion request failed.");
    }
  };

  const chartData = (usage?.byDay || []).map(d => ({ ...d, label: formatShortDate(d.date) }));
  const byUser = usage?.byUser || [];
  const byDataset = usage?.byDataset || [];
  const costUnconfigured = usage && usage.totalRequests > 0 && usage.estimatedCost === 0;

  // Filter logs locally based on action type selection
  const filteredLogs = logs.filter(l => {
    if (logsFilter === "all") return true;
    return l.action === logsFilter;
  });

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Title block */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#2B2A27" }}>Admin Dashboard</div>
        <button onClick={onBack}
          style={{ fontSize: 12, fontWeight: 600, color: "#2B2A27", background: "#F7F5F0", border: "1px solid #E4E0D8", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>
          ← Back to dashboard
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #EAE7E0", marginBottom: 20 }}>
        {[
          { id: "dashboard", label: "📊 Overview" },
          { id: "security", label: "🛡️ Security & Controls" },
          { id: "invites", label: "✉️ Invites" },
          { id: "audit", label: "📜 Audit Trail" },
          { id: "danger", label: "⚠️ Danger Zone" }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              border: "none",
              background: "none",
              borderBottom: activeTab === t.id ? "2px solid #3E6F8E" : "2px solid transparent",
              color: activeTab === t.id ? "#3E6F8E" : "#8A8580",
              fontWeight: 600,
              fontSize: 13,
              padding: "8px 12px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ ...card, marginBottom: 14, color: "#B85C5C", fontSize: 13 }}>{error}</div>
      )}

      {loading && activeTab === "dashboard" ? (
        <div style={{ color: "#8A8580", fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "dashboard" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                <div style={card}>
                  <div style={label}>Site-Wide Analytics</div>
                  {visitorStats?.status === "unavailable" || visitorStats?.uniqueBrowsers == null ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#B45309", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>⚠️</span> <span>Analytics Temporarily Unavailable</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                        Database unreachable; site-wide visitor metrics paused.
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>💻</span> <span>{Number(visitorStats.uniqueBrowsers || 0).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                        Unique browsers ({Number(visitorStats.totalSessions || 0).toLocaleString()} sessions)
                      </div>
                      <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 3, lineHeight: 1.3 }}>
                        Distinct browser clients via backend analytics. Multi-device users count separately.
                      </div>
                    </>
                  )}
                </div>
                <div style={card}>
                  <div style={label}>Registered Users</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>👤</span> <span>{Number(members?.length || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Active registered accounts</div>
                </div>
                <div style={card}>
                  <div style={label}>Datasets Connected</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📂</span> <span>{Number(summary?.datasetCount ?? datasets?.length ?? 0).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Business data sources</div>
                </div>
                <div style={card}>
                  <div style={label}>Rows Analyzed</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📊</span> <span>{Number(summary?.totalRowsAnalyzed ?? 12480).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Processed in pipelines</div>
                </div>
              </div>

              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2B2A27", marginBottom: 10 }}>AI usage</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
                <div style={card}>
                  <div style={label}>AI requests</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{usage?.totalRequests != null ? Number(usage.totalRequests).toLocaleString() : "—"}</div>
                </div>
                <div style={card}>
                  <div style={label}>Total tokens</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{usage?.totalTokens != null ? Number(usage.totalTokens).toLocaleString() : "—"}</div>
                </div>
                <div style={card}>
                  <div style={label}>Estimated cost</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#2B2A27", marginTop: 4 }}>{usage ? formatCost(usage.estimatedCost) : "—"}</div>
                </div>
              </div>
              {costUnconfigured && (
                <div style={{ fontSize: 11.5, color: "#A6A196", marginBottom: 14 }}>
                  Cost shows $0.00 because per-token pricing isn't configured on the backend yet.
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
                          <td style={td}>{u?.email || "—"}</td>
                          <td style={td}>{Number(u?.requests || 0).toLocaleString()}</td>
                          <td style={td}>{Number(u?.tokens || 0).toLocaleString()}</td>
                          <td style={td}>{formatCost(u?.cost)}</td>
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
                          <td style={td}>{d?.name || "—"}</td>
                          <td style={td}>{Number(d?.requests || 0).toLocaleString()}</td>
                          <td style={td}>{Number(d?.tokens || 0).toLocaleString()}</td>
                          <td style={td}>{formatCost(d?.cost)}</td>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>
                      Registered Users & Member Directory ({members?.length || 0})
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B" }}>
                      Real-time user profiles, role-based privileges, onboarding stages & usage records.
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search name, email, role..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        padding: "6px 12px",
                        fontSize: 12.5,
                        borderRadius: 8,
                        border: "1px solid #CBD5E1",
                        outline: "none",
                        width: 240,
                        maxWidth: "100%",
                        background: "#FFF"
                      }}
                    />

                    {currentUserEmail === "tulasidachepally9393@gmail.com" && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={async () => {
                            try {
                              await api.sendAdminUserReportEmail();
                              alert("🎉 Full user report sent to tulasidachepally9393@gmail.com!");
                            } catch (err) {
                              alert(err.message || "Failed to send report email.");
                            }
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: "#8B5CF6",
                            color: "#FFF",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          📧 Email Full Report
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await api.sendAdminMonthlyReportEmail();
                              alert("📅 Monthly report sent to tulasidachepally9393@gmail.com!");
                            } catch (err) {
                              alert(err.message || "Failed to send monthly report email.");
                            }
                          }}
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: "#10B981",
                            color: "#FFF",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          📅 Monthly Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>User Profile</th>
                        <th style={th}>Business Role</th>
                        <th style={th}>Company Workspace</th>
                        <th style={th}>Status</th>
                        <th style={th}>Onboarding</th>
                        {currentUserEmail === "tulasidachepally9393@gmail.com" && <th style={th}>Datasets</th>}
                        <th style={th}>Joined</th>
                        <th style={th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .filter(m => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            (m.fullName && m.fullName.toLowerCase().includes(q)) ||
                            (m.email && m.email.toLowerCase().includes(q)) ||
                            (m.role && m.role.toLowerCase().includes(q)) ||
                            (m.companyName && m.companyName.toLowerCase().includes(q))
                          );
                        })
                        .map(m => {
                          const badge = {
                            ceo: { label: "👔 Executive", bg: "rgba(37, 99, 235, 0.1)", color: "#1D4ED8" },
                            finance: { label: "💰 Finance", bg: "rgba(16, 185, 129, 0.1)", color: "#047857" },
                            hr: { label: "👥 HR", bg: "rgba(245, 158, 11, 0.1)", color: "#B45309" },
                            recruiter: { label: "🎯 Recruiter", bg: "rgba(236, 72, 153, 0.1)", color: "#BE185D" },
                            data_analyst: { label: "📊 Analyst", bg: "rgba(99, 102, 241, 0.1)", color: "#4338CA" },
                            data_scientist: { label: "🧪 Scientist", bg: "rgba(139, 92, 246, 0.1)", color: "#6D28D9" },
                            admin: { label: "🛡️ Admin", bg: "rgba(15, 23, 42, 0.1)", color: "#0F172A" }
                          }[m.role] || { label: m.role || "Member", bg: "#F1F5F9", color: "#475569" };

                          return (
                            <tr key={m.id || m.email || Math.random()}>
                              <td style={td}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    background: "#E2E8F0",
                                    color: "#0F172A",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}>
                                    {String(m?.fullName || m?.email || "U").trim()[0]?.toUpperCase() || "U"}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>
                                      {m.fullName || m.email?.split("@")[0]}
                                      {m.email === currentUserEmail ? " (You)" : ""}
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "#64748B" }}>{m.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={td}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  background: badge.bg,
                                  color: badge.color
                                }}>
                                  {badge.label}
                                </span>
                              </td>
                              <td style={td}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>
                                  {m.companyName || "Default Workspace"}
                                </div>
                                <span style={{ textTransform: "uppercase", fontSize: 10, fontWeight: 700, color: "#64748B" }}>
                                  Tier: {m.tier || "pro"}
                                </span>
                              </td>
                              <td style={td}>
                                <span style={{
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  color: m.emailVerified ? "#059669" : "#D97706",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4
                                }}>
                                  <span>{m.emailVerified ? "●" : "○"}</span>
                                  <span>{m.status || (m.emailVerified ? "Active" : "Unverified")}</span>
                                </span>
                              </td>
                              <td style={td}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: m.onboardingProgress === "Completed" ? "#DCFCE7" : "#FEF3C7",
                                  color: m.onboardingProgress === "Completed" ? "#166534" : "#92400E"
                                }}>
                                  {m.onboardingProgress || "Completed"}
                                </span>
                              </td>
                              {currentUserEmail === "tulasidachepally9393@gmail.com" && (
                                <td style={td}>{m?.datasetCount != null ? Number(m.datasetCount).toLocaleString() : 0}</td>
                              )}
                              <td style={td}>
                                <div style={{ fontSize: 12, color: "#0F172A" }}>{formatDateOnly(m.createdAt)}</div>
                                <div style={{ fontSize: 10.5, color: "#94A3B8" }}>
                                  {m.lastLogin ? `Seen ${formatShortDate(m.lastLogin)}` : "Recent"}
                                </div>
                              </td>
                              <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                                {m.email !== currentUserEmail && (
                                  <>
                                    <button onClick={() => handleToggleRole(m)}
                                      style={{ fontSize: 11.5, color: "#2563EB", background: "none", border: "1px solid #BFDBFE", borderRadius: 6, padding: "4px 9px", cursor: "pointer", marginRight: 6 }}>
                                      {m.role === "admin" ? "Demote" : "Promote"}
                                    </button>
                                    <button onClick={() => handleRemove(m)}
                                      style={{ fontSize: 11.5, color: "#DC2626", background: "none", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 9px", cursor: "pointer" }}>
                                      Remove
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {members.length === 0 && (
                        <tr><td style={td} colSpan={8}>No registered members found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                      <tr key={d?.id || Math.random()}>
                        <td style={td}>{d?.name || "Untitled Dataset"}</td>
                        <td style={td}>{Number(d?.rowCount || 0).toLocaleString()}</td>
                        <td style={td}>{d?.qualityScore != null ? `${d.qualityScore}%` : "—"}</td>
                        <td style={td}>{d?.createdByEmail || "—"}</td>
                        <td style={td}>{formatDateOnly(d?.updatedAt)}</td>
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

          {/* SECURITY & SOC TAB */}
          {activeTab === "security" && (
            <AdminSecurityCenter currentUserEmail={currentUserEmail} />
          )}

          {/* INVITES TAB */}
          {activeTab === "invites" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Invite Generator */}
              <div style={card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2A27", marginBottom: 12 }}>Invite Teammates</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#8A8580", fontWeight: 600 }}>RESTRICT TO EMAIL (OPTIONAL)</span>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #DDD8CE", fontSize: 12.5, width: 200 }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#8A8580", fontWeight: 600 }}>WORKSPACE ROLE</span>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #DDD8CE", fontSize: 12.5, background: "#fff", width: 130 }}
                    >
                      <option value="member">Member</option>
                      <option value="mis_analyst">MIS Analyst</option>
                      <option value="data_analyst">Data Analyst</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#8A8580", fontWeight: 600 }}>MAX USES</span>
                    <input
                      type="number"
                      min={1}
                      value={inviteMaxUses}
                      onChange={e => setInviteMaxUses(Number(e.target.value))}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #DDD8CE", fontSize: 12.5, width: 70 }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "#8A8580", fontWeight: 600 }}>EXPIRATION</span>
                    <select
                      value={inviteExpiresDays}
                      onChange={e => setInviteExpiresDays(Number(e.target.value))}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #DDD8CE", fontSize: 12.5, background: "#fff", width: 100 }}
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreateInvite}
                    style={{ background: "#3E6F8E", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", height: 32 }}
                  >
                    Generate Invite Link
                  </button>
                </div>

                {generatedLink && (
                  <div style={{ marginTop: 14, background: "#F0F6F9", border: "1px solid #B9CDE3", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#2E5C7A", flex: 1, marginRight: 10 }}>{generatedLink}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(generatedLink); alert("Link copied!"); }}
                      style={{ border: "none", background: "#3E6F8E", color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>

              {/* Active Invites List */}
              <div style={card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2A27", marginBottom: 12 }}>Pending Invitations</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Invite URL Token</th>
                      <th style={th}>Restricted Email</th>
                      <th style={th}>Role</th>
                      <th style={th}>Uses</th>
                      <th style={th}>Expires At</th>
                      <th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map(i => (
                      <tr key={i.id}>
                        <td style={{ ...td, fontFamily: "monospace", fontSize: 11.5, color: "#3E6F8E" }}>
                          signup?invite={i.token.slice(0, 10)}...
                        </td>
                        <td style={td}>{i.email || "Anyone"}</td>
                        <td style={td}>{i.role}</td>
                        <td style={td}>{i.useCount} / {i.maxUses}</td>
                        <td style={td}>{formatDateOnly(i.expiresAt)}</td>
                        <td style={{ ...td, textAlign: "right" }}>
                          <button
                            onClick={() => handleRevokeInvite(i.id)}
                            style={{ fontSize: 11.5, color: "#B85C5C", background: "none", border: "1px solid #E4C9C9", borderRadius: 6, padding: "4px 9px", cursor: "pointer" }}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                    {invites.length === 0 && (
                      <tr><td style={td} colSpan={6}>No active pending invites found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT TRAIL TAB */}
          {activeTab === "audit" && (
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2B2A27" }}>Compliance Audit Log ({logsTotal} logs)</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#8A8580" }}>Filter:</span>
                  <select
                    value={logsFilter}
                    onChange={e => setLogsFilter(e.target.value)}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #DDD8CE", fontSize: 12, background: "#fff" }}
                  >
                    <option value="all">All Events</option>
                    <option value="UPLOAD_DATASET">Upload Dataset</option>
                    <option value="DELETE_DATASET">Delete Dataset</option>
                    <option value="CREATE_INVITE">Create Invite</option>
                    <option value="REVOKE_INVITE">Revoke Invite</option>
                    <option value="ACCEPT_INVITE">Accept Invite</option>
                    <option value="SIGNUP_NEW_ORG">Create Org</option>
                    <option value="UPDATE_ROLE">Update Role</option>
                    <option value="REMOVE_MEMBER">Remove Member</option>
                    <option value="UPGRADE_PLAN">Upgrade Plan</option>
                    <option value="REQUEST_WORKSPACE_DELETE">Purge Request</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Timestamp</th>
                      <th style={th}>Action</th>
                      <th style={th}>User</th>
                      <th style={th}>Target Details</th>
                      <th style={th}>IP Address</th>
                      <th style={th}>User Agent Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(l => (
                      <tr key={l.id}>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{formatDate(l.createdAt)}</td>
                        <td style={td}>
                          <span style={{
                            background: l.action.includes("DELETE") || l.action.includes("REMOVE") ? "#FBEBEB" : "#F0F6F9",
                            color: l.action.includes("DELETE") || l.action.includes("REMOVE") ? "#B85C5C" : "#3E6F8E",
                            padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700
                          }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={td}>{l.userEmail}</td>
                        <td style={td}>{l.target}</td>
                        <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{l.ipAddress || "—"}</td>
                        <td style={{ ...td, fontSize: 11.5, color: "#8A8580", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }} title={l.userAgent}>
                          {l.userAgent ? l.userAgent.split(" ")[0] || "Client" : "—"}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr><td style={td} colSpan={6}>No audit records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {logsPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: "#8A8580" }}>Page {logsPage} of {logsPages}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      disabled={logsPage === 1}
                      onClick={() => setLogsPage(p => p - 1)}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #DDD8CE", background: "#fff", cursor: logsPage === 1 ? "default" : "pointer", fontSize: 12 }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={logsPage >= logsPages}
                      onClick={() => setLogsPage(p => p + 1)}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #DDD8CE", background: "#fff", cursor: logsPage >= logsPages ? "default" : "pointer", fontSize: 12 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === "danger" && (
            <div style={{ ...card, borderColor: "#B85C5C", background: "#FFFDFD" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#B85C5C", marginBottom: 6 }}>Danger Zone: Purge Workspace</div>
              <p style={{ fontSize: 13, color: "#5C584F", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                Scheduling workspace deletion will flag your organization as deleted and instantly log out all team members. 
                For compliance requirements, this is a <strong>soft-delete</strong> action:
              </p>
              <ul style={{ fontSize: 12.5, color: "#8A8580", paddingLeft: 18, margin: "0 0 16px 0", display: "flex", flexDirection: "column", gap: 6 }}>
                <li>Your data is preserved in an isolated archive during a <strong>30-day grace period</strong>.</li>
                <li>An administrator confirmation email will be sent containing a <strong>"cancel deletion"</strong> link.</li>
                <li>The compliance audit logs generated by your team will be kept intact and will not be cascading-deleted.</li>
              </ul>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400, marginTop: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#8A8580", fontWeight: 600 }}>CONFIRM COMPANY NAME (Type <strong>{user?.companyName}</strong>)</span>
                  <input
                    type="text"
                    name="confirm_company_name_no_autofill"
                    autoComplete="off"
                    value={confirmName}
                    onChange={e => setConfirmName(e.target.value)}
                    placeholder={`Type "${user?.companyName || 'Tulasi'}" to confirm...`}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E4C9C9", fontSize: 12.5 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#8A8580", fontWeight: 600 }}>VERIFY PASSWORD</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Enter your account password..."
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E4C9C9", fontSize: 12.5 }}
                  />
                </div>

                <button
                  onClick={handleDeleteWorkspace}
                  style={{ background: "#B85C5C", color: "#fff", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 6, transition: "background 0.2s" }}
                >
                  Schedule Workspace Deletion
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
