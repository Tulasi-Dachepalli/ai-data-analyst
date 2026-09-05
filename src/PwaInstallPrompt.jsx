import React, { useState, useEffect } from "react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "#ECFDF5", padding: "4px 10px", borderRadius: 12 }}>
        ✅ App Installed
      </span>
    );
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstallClick}
      title="Install as a standalone desktop/mobile application"
      style={{
        backgroundColor: "#10B981",
        color: "#FFF",
        border: "none",
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
      }}
    >
      📲 Install App
    </button>
  );
}
