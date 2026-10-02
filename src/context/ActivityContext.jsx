// src/context/ActivityContext.jsx
import React, { createContext, useContext, useState } from "react";

const ActivityContext = createContext(null);

const DEFAULT_INITIAL_EVENTS = [];

export function ActivityProvider({ children }) {
  const [events, setEvents] = useState(DEFAULT_INITIAL_EVENTS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logEvent = ({ stage, action, status = "completed", datasetVersion = "v4", affectedRows = 0, affectedColumns = 0, result = "" }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const newEvt = {
      id: "evt-" + Date.now(),
      timestamp: timeStr,
      stage,
      action,
      status,
      datasetVersion,
      affectedRows,
      affectedColumns,
      result
    };
    setEvents(prev => [newEvt, ...prev]);
  };

  const openActivityDrawer = () => setDrawerOpen(true);
  const closeActivityDrawer = () => setDrawerOpen(false);

  return (
    <ActivityContext.Provider value={{
      events,
      isProcessing,
      setIsProcessing,
      drawerOpen,
      openActivityDrawer,
      closeActivityDrawer,
      logEvent
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within an ActivityProvider");
  return ctx;
}
