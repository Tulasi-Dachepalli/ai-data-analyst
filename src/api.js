const base = () => import.meta.env.VITE_API_BASE_URL || "";

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

export function updateDataset(id, { dashboard, messages }) {
  return request(`/api/datasets/${id}`, {
    method: "PUT",
    body: JSON.stringify({ dashboard, messages })
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
