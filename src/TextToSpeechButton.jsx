import React, { useState, useEffect } from "react";

export default function TextToSpeechButton({ text }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanText = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/[*_#`~]/g, "") // remove markdown bold/italic/headers
      .replace(/\[.*?\]\(.*?\)/g, "") // remove links
      .replace(/•/g, "")
      .trim();
  };

  const handleToggleSpeak = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any previous speech
      const speakText = cleanText(text);
      if (!speakText) return;

      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      title={isSpeaking ? "Stop AI voice readout" : "Read answer aloud with AI voice"}
      style={{
        background: isSpeaking ? "rgba(239, 68, 68, 0.1)" : "var(--bg-hover, #F3F4F6)",
        color: isSpeaking ? "#EF4444" : "var(--text-secondary, #4B5563)",
        border: `1px solid ${isSpeaking ? "#FCA5A5" : "var(--border-color, #E5E7EB)"}`,
        borderRadius: 12,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        transition: "all 0.15s ease",
        marginTop: 4
      }}
    >
      {isSpeaking ? "🛑 Stop Voice" : "🔊 Read Aloud"}
    </button>
  );
}
