import React, { useState, useEffect, useRef } from "react";

export default function VoiceInputButton({ onSpeechResult }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && onSpeechResult) {
        onSpeechResult(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onSpeechResult]);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? "Listening... Click to stop" : "Speak question with microphone"}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: isListening ? "2px solid #EF4444" : "1px solid #DDD8CE",
        background: isListening ? "#FEF2F2" : "#FFF",
        color: isListening ? "#EF4444" : "#6B7280",
        fontSize: 15,
        cursor: "pointer",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 1,
        transition: "all 0.2s ease",
        animation: isListening ? "pulse 1.5s infinite" : "none"
      }}
    >
      {isListening ? "🔴" : "🎙️"}
    </button>
  );
}
