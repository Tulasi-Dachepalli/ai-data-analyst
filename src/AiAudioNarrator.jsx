import React, { useState, useEffect } from "react";

export default function AiAudioNarrator({ text = "", title = "Executive Briefing Podcast" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(0);

  useEffect(() => {
    const updateVoices = () => {
      const avail = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      setVoices(avail);
    };

    updateVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (!window.speechSynthesis) {
      alert("Web Speech Synthesis is not supported in this browser.");
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#_`-]/g, "").trim() || "Welcome to your AI Executive Data Briefing. Overall data quality is rated at 98% clean.";
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    if (voices[selectedVoice]) {
      utterance.voice = voices[selectedVoice];
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleRateChange = (newRate) => {
    setRate(newRate);
    if (isPlaying) {
      handleStop();
    }
  };

  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, margin: "16px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 24 }}>🎙️</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1F2937" }}>AI Audio Voice Narrator</div>
            <div style={{ fontSize: 11.5, color: "#6B7280" }}>Listen to audio podcast briefing</div>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              style={{ backgroundColor: "#8B5CF6", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              ▶️ {isPaused ? "Resume Audio" : "Listen Briefing"}
            </button>
          ) : (
            <button
              onClick={handlePause}
              style={{ backgroundColor: "#F59E0B", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              ⏸️ Pause
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              style={{ backgroundColor: "#EF4444", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              ⏹️ Stop
            </button>
          )}

          {/* Speed Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFF", border: "1px solid #D1D5DB", borderRadius: 6, padding: "2px 4px" }}>
            {[1.0, 1.25, 1.5, 2.0].map(s => (
              <button
                key={s}
                onClick={() => handleRateChange(s)}
                style={{
                  background: rate === s ? "#8B5CF6" : "transparent",
                  color: rate === s ? "#FFF" : "#374151",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Voice Selector */}
          {voices.length > 0 && (
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(Number(e.target.value))}
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 11.5, backgroundColor: "#FFF" }}
            >
              {voices.slice(0, 8).map((v, idx) => (
                <option key={idx} value={idx}>{v.name} ({v.lang})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Animated Equalizer Bars when speaking */}
      {isPlaying && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8B5CF6", marginRight: 6 }}>Speaking AI Audio Briefing:</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 16 }}>
            <div style={{ width: 3, height: "100%", backgroundColor: "#8B5CF6", borderRadius: 2, animation: "pulse 0.6s infinite alternate" }} />
            <div style={{ width: 3, height: "60%", backgroundColor: "#8B5CF6", borderRadius: 2, animation: "pulse 0.4s infinite alternate" }} />
            <div style={{ width: 3, height: "80%", backgroundColor: "#8B5CF6", borderRadius: 2, animation: "pulse 0.7s infinite alternate" }} />
            <div style={{ width: 3, height: "40%", backgroundColor: "#8B5CF6", borderRadius: 2, animation: "pulse 0.5s infinite alternate" }} />
          </div>
        </div>
      )}
    </div>
  );
}
