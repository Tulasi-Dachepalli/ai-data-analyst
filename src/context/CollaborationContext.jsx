// src/context/CollaborationContext.jsx
// CollaborationProvider managing threaded discussions, dataset provenance, and sharing permissions

import React, { createContext, useContext, useState, useEffect } from "react";
import { useDataset } from "./DatasetContext";
import { useRole } from "./RoleContext";
import {
  getComments,
  createComment,
  getShares,
  createShare,
  checkPermission
} from "../services/collaborationService";

const CollaborationContext = createContext(null);

export function CollaborationProvider({ children }) {
  const { activeDataset, currentVersion } = useDataset() || {};
  const { user, activeRole } = useRole() || {};

  const [comments, setComments] = useState([]);
  const [shares, setShares] = useState(getShares());
  const [shareOpen, setShareOpen] = useState(false);
  const [activeShareTarget, setActiveShareTarget] = useState(null);

  // Sync comments for the active dataset
  useEffect(() => {
    if (!activeDataset) {
      setComments([]);
      return;
    }

    const datasetId = activeDataset.id;
    const version = currentVersion?.version || "v1";

    const existing = getComments(datasetId);
    if (existing.length > 0) {
      setComments(existing);
      return;
    }

    // Initialize with a dataset-scoped baseline discussion thread
    const c1 = createComment({
      datasetId,
      datasetVersion: version,
      userId: user?.email || "analyst@enterprise.com",
      author: user?.role === "ceo" ? "Executive Team" : "Tulasi (Lead)",
      role: activeRole || "data_analyst",
      message: `Initial analysis workspace created for ${activeDataset.name} (${version}). All transformations and insights are version-grounded.`,
      topic: `${activeDataset.name} Discussion`
    });

    setComments([c1]);
  }, [activeDataset?.id, activeDataset?.name]);

  const addCommentHandler = ({
    message,
    topic = "General Workspace Analysis",
    parentCommentId = null,
    entityType = "dataset",
    entityId = null
  }) => {
    if (!canComment()) {
      throw new Error(`Unauthorized: Role '${activeRole}' does not have permission to post comments.`);
    }

    const newComment = createComment({
      parentCommentId,
      entityType,
      entityId: entityId || activeDataset?.id,
      datasetId: activeDataset?.id,
      datasetVersion: currentVersion?.version || "v1",
      userId: user?.email || "analyst@enterprise.com",
      author: user?.role === "ceo" ? "Executive Leader" : "Tulasi (Lead)",
      role: activeRole || "data_analyst",
      message,
      topic
    });

    setComments(prev => [newComment, ...prev]);
    return newComment;
  };

  const createShareHandler = ({ userOrEmail, permission = "View" }) => {
    if (!canEdit()) {
      return { success: false, error: `Unauthorized: Role '${activeRole}' cannot manage workspace sharing permissions.` };
    }

    const share = createShare({
      userOrEmail,
      permission,
      grantedBy: user?.email || "Tulasi"
    });

    setShares(prev => [share, ...prev]);
    return { success: true, share };
  };

  const openShareModal = (target = null) => {
    setActiveShareTarget(target);
    setShareOpen(true);
  };

  const closeShareModal = () => {
    setShareOpen(false);
    setActiveShareTarget(null);
  };

  const canView = () => checkPermission(activeRole, "View");
  const canComment = () => checkPermission(activeRole, "Comment");
  const canEdit = () => checkPermission(activeRole, "Edit");

  return (
    <CollaborationContext.Provider value={{
      comments,
      addComment: addCommentHandler,
      shares,
      createShare: createShareHandler,
      shareOpen,
      activeShareTarget,
      openShareModal,
      closeShareModal,
      canView,
      canComment,
      canEdit
    }}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  if (!ctx) throw new Error("useCollaboration must be used within a CollaborationProvider");
  return ctx;
}
