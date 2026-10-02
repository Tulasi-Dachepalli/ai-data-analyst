// src/services/collaborationService.js
// Enterprise Collaboration & Threaded Discussion Service with dataset provenance

let inMemoryComments = [];
let inMemoryShares = [
  { id: "share-default-1", userOrEmail: "finance.manager@enterprise.com", permission: "Comment", grantedAt: new Date().toISOString() },
  { id: "share-default-2", userOrEmail: "audit.team@enterprise.com", permission: "View", grantedAt: new Date().toISOString() }
];

export function getComments(datasetId = null) {
  if (!datasetId) return inMemoryComments;
  return inMemoryComments.filter(c => c.datasetId === datasetId);
}

export function createComment({
  parentCommentId = null,
  entityType = "dataset",
  entityId = null,
  datasetId = null,
  datasetVersion = "v1",
  userId = "user-1",
  author = "Tulasi (Lead)",
  role = "data_analyst",
  message,
  topic = "General Workspace Analysis"
}) {
  if (!message || !message.trim()) {
    throw new Error("Comment message cannot be empty");
  }

  const comment = {
    commentId: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    id: `c-${Date.now()}`,
    parentCommentId,
    entityType,
    entityId: entityId || datasetId,
    datasetId,
    datasetVersion,
    userId,
    author,
    avatar: author.charAt(0).toUpperCase(),
    role,
    message: message.trim(),
    comment: message.trim(), // backward compat
    topic,
    createdAt: new Date().toISOString(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  inMemoryComments.unshift(comment);
  return comment;
}

export function getShares() {
  return inMemoryShares;
}

export function createShare({ userOrEmail, permission = "View", grantedBy = "Tulasi" }) {
  if (!userOrEmail || !userOrEmail.trim()) {
    throw new Error("Share target email or username is required");
  }

  const validPerms = ["View", "Comment", "Edit"];
  const sanitizedPerm = validPerms.includes(permission) ? permission : "View";

  const share = {
    id: `share-${Date.now()}`,
    userOrEmail: userOrEmail.trim(),
    permission: sanitizedPerm,
    grantedBy,
    grantedAt: new Date().toISOString()
  };

  inMemoryShares.unshift(share);
  return share;
}

export function checkPermission(userRole, requiredLevel = "View") {
  const levels = { "View": 1, "Comment": 2, "Edit": 3 };
  const rolePermissions = {
    "admin": 3,
    "data_analyst": 3,
    "data_scientist": 3,
    "ceo": 2,
    "finance": 2,
    "hr": 2,
    "recruiter": 1,
    "viewer": 1
  };

  const userLevel = rolePermissions[userRole] || 1;
  const required = levels[requiredLevel] || 1;
  return userLevel >= required;
}
