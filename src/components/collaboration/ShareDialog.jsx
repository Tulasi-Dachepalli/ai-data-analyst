// src/components/collaboration/ShareDialog.jsx
import React, { useState } from "react";
import { useCollaboration } from "../../context/CollaborationContext";

export default function ShareDialog() {
  const { shareOpen, closeShareModal, activeShareTarget, createShare } = useCollaboration();
  const [recipient, setRecipient] = useState("Finance Manager (Raj Sharma)");
  const [permission, setPermission] = useState("Comment"); // View, Comment, Edit
  const [shared, setShared] = useState(false);

  if (!shareOpen) return null;

  const handleShare = () => {
    if (createShare) {
      createShare({ userOrEmail: recipient, permission });
    }
    setShared(true);
    setTimeout(() => {
      setShared(false);
      closeShareModal();
    }, 1200);
  };

  return (
    <div
      data-testid="share-dialog-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div style={{
        width: 480,
        maxWidth: "95vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              👥 Team Collaboration & Sharing
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              Share Analysis Thread
            </div>
          </div>
          <button
            data-testid="close-share-dialog"
            onClick={closeShareModal}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#FFF",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {shared ? (
            <div
              data-testid="share-success-alert"
              style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 20, textAlign: "center", color: "#166534", fontSize: 14, fontWeight: 700 }}
            >
              ✓ Shared successfully with {recipient}!
            </div>
          ) : (
            <>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, fontSize: 12.5, color: "#0F172A" }}>
                Target: <strong>{activeShareTarget || "Current Dataset Workspace Analysis"}</strong>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                  Select Collaborator / Team Member
                </label>
                <select
                  data-testid="share-recipient-select"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, background: "#F8FAFC" }}
                >
                  <option value="Finance Manager (Raj Sharma)">Finance Manager (Raj Sharma)</option>
                  <option value="CEO / Executive (Enterprise Lead)">CEO / Executive (Enterprise Lead)</option>
                  <option value="HR Director (Sarah Jenkins)">HR Director (Sarah Jenkins)</option>
                  <option value="Recruitment Lead (Alex Mercer)">Recruitment Lead (Alex Mercer)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                  Access Permission Level
                </label>
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { id: "View", label: "Can View" },
                    { id: "Comment", label: "Can Comment" },
                    { id: "Edit", label: "Can Edit" }
                  ].map(p => (
                    <label key={p.id} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="perm"
                        data-testid={`perm-${p.id.toLowerCase()}`}
                        checked={permission === p.id}
                        onChange={() => setPermission(p.id)}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={closeShareModal}
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, color: "#475569", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  data-testid="submit-share-btn"
                  onClick={handleShare}
                  style={{ background: "#2563EB", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                >
                  🚀 Share Analysis Thread
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
