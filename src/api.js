const base = () => import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";

function authHeaders() {
  const token = localStorage.getItem("aida_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${base()}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) }
  });
  if (res.status === 401) {
    localStorage.removeItem("aida_token");
    localStorage.removeItem("aida_user");
    window.location.reload();
    return null;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function listDatasets() {
  return request("/api/datasets");
}

export function getDataset(id) {
  return request(`/api/datasets/${id}`);
}

export function createDataset(payload) {
  return request("/api/datasets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function uploadDatasetFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = localStorage.getItem("aida_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  return fetch(`${base()}/api/datasets/upload`, {
    method: "POST",
    headers,
    body: formData
  }).then(async (res) => {
    if (res.status === 401) {
      localStorage.removeItem("aida_token");
      localStorage.removeItem("aida_user");
      window.location.reload();
      return null;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload failed (${res.status})`);
    }
    return res.json();
  });
}

export function updateDataset(id, { dashboard, messages }) {
  return request(`/api/datasets/${id}`, {
    method: "PUT",
    body: JSON.stringify({ dashboard, messages })
  });
}

export function cleanDataset(id) {
  return request(`/api/datasets/${id}/clean`, {
    method: "POST"
  });
}

export function getDatasetEda(id) {
  return request(`/api/datasets/${id}/eda`, {
    method: "POST"
  });
}

export function getDatasetStatistics(id) {
  return request(`/api/datasets/${id}/statistics`, {
    method: "POST"
  });
}

export function analyzeMlTasks(id) {
  return request(`/api/datasets/${id}/ml/analyze`, {
    method: "POST"
  });
}

export function trainMlModel(id, payload) {
  return request(`/api/datasets/${id}/ml/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function predictMlModel(id, model_id, rows) {
  return request(`/api/datasets/${id}/ml/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_id, rows })
  });
}

export function analyzeForecastOption(id) {
  return request(`/api/datasets/${id}/forecast/analyze`, {
    method: "POST"
  });
}

export function trainForecastModel(id, payload) {
  return request(`/api/datasets/${id}/forecast/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function getDatasetInsights(id) {
  return request(`/api/datasets/${id}/insights`, {
    method: "POST"
  });
}

export function chatDataset(id, question) {
  return request(`/api/datasets/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });
}

export function deleteDataset(id) {
  return request(`/api/datasets/${id}`, { method: "DELETE" });
}

export function getAdminSummary() {
  return request("/api/admin/summary");
}

export function getAdminMembers() {
  return request("/api/admin/members");
}

export function removeMember(id) {
  return request(`/api/admin/members/${id}`, { method: "DELETE" });
}

export function updateMemberRole(id, role) {
  return request(`/api/admin/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export function getAdminDatasets() {
  return request("/api/admin/datasets");
}

export function getAdminUsage() {
  return request("/api/admin/usage");
}

export function forgotPassword(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function resetPassword(token, password) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
}

export function resendVerification() {
  return request("/api/auth/resend-verification", { method: "POST" });
}

export function upgradeSubscription(tier) {
  return request("/api/admin/upgrade", {
    method: "POST",
    body: JSON.stringify({ tier })
  });
}

export function getAdminInvites() {
  return request("/api/admin/invites");
}

export function createAdminInvite(payload) {
  return request("/api/admin/invites", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminInvite(id) {
  return request(`/api/admin/invites/${id}`, { method: "DELETE" });
}

export function getAuditLogs(page = 1, limit = 50) {
  return request(`/api/admin/audit-logs?page=${page}&limit=${limit}`);
}

export function deleteWorkspace(password) {
  return request("/api/admin/workspace", {
    method: "DELETE",
    body: JSON.stringify({ password })
  });
}
