// src/context/CopilotContext.jsx
import React, { createContext, useContext, useState } from "react";
import { getCopilotPrompts } from "../config/copilotPrompts";

const CopilotContext = createContext(null);

export function CopilotProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Analyzing dataset...");
  const [copilotOpen, setCopilotOpen] = useState(false);

  const clearMessages = () => setMessages([]);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: `msg_${Date.now()}_${Math.random()}`, createdAt: new Date().toISOString(), ...msg }]);
  };

  return (
    <CopilotContext.Provider value={{
      messages,
      loading,
      loadingLabel,
      copilotOpen,
      setCopilotOpen,
      setLoading,
      setLoadingLabel,
      clearMessages,
      addMessage,
      getCopilotPrompts
    }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error("useCopilot must be used within a CopilotProvider");
  }
  return context;
}
