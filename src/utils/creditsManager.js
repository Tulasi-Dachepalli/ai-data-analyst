// src/utils/creditsManager.js
import { useState, useEffect, useCallback } from "react";

export const DEFAULT_CREDITS = 50;
export const DEFAULT_TOKEN_LIMIT = 50000;
export const TOKENS_PER_CREDIT = 500;
export const COOLDOWN_HOURS = 5;

/**
 * Retrieve current credit and token quota status from localStorage
 */
export function getCreditsInfo() {
  if (typeof window === "undefined") {
    return {
      credits: DEFAULT_CREDITS,
      usedTokens: 0,
      limit: DEFAULT_TOKEN_LIMIT,
      resetTime: null,
      tier: "pro"
    };
  }

  // Check 5-hour cooldown auto-reset
  const resetTimeStr = localStorage.getItem("aida_token_reset_time");
  if (resetTimeStr) {
    const resetTime = parseInt(resetTimeStr, 10);
    if (Date.now() >= resetTime) {
      localStorage.setItem("aida_used_tokens", "0");
      localStorage.setItem("aida_credits", String(DEFAULT_CREDITS));
      localStorage.removeItem("aida_token_reset_time");
    }
  }

  const credits = parseInt(localStorage.getItem("aida_credits") || String(DEFAULT_CREDITS), 10);
  const usedTokens = parseInt(localStorage.getItem("aida_used_tokens") || "0", 10);
  const activeResetStr = localStorage.getItem("aida_token_reset_time");
  const nextResetTime = activeResetStr ? parseInt(activeResetStr, 10) : null;

  let tier = "pro";
  try {
    const rawUser = localStorage.getItem("aida_user");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.tier) tier = u.tier;
    }
  } catch {}

  return {
    credits: isNaN(credits) ? DEFAULT_CREDITS : credits,
    usedTokens: isNaN(usedTokens) ? 0 : usedTokens,
    limit: DEFAULT_TOKEN_LIMIT,
    resetTime: nextResetTime && Date.now() < nextResetTime ? nextResetTime : null,
    tier
  };
}

/**
 * Consumes 1 credit and specified tokens, notifying all UI subscribers
 */
export function consumeCredit(tokensToConsume = TOKENS_PER_CREDIT) {
  if (typeof window === "undefined") return;

  try {
    const current = getCreditsInfo();
    const nextCredits = Math.max(0, current.credits - 1);
    const nextUsed = current.usedTokens + tokensToConsume;

    localStorage.setItem("aida_credits", String(nextCredits));
    localStorage.setItem("aida_used_tokens", String(nextUsed));

    let resetTime = localStorage.getItem("aida_token_reset_time");
    if (nextUsed >= current.limit && !resetTime) {
      const fiveHoursLater = Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000;
      localStorage.setItem("aida_token_reset_time", String(fiveHoursLater));
      resetTime = String(fiveHoursLater);
    }

    const detail = {
      credits: nextCredits,
      usedTokens: nextUsed,
      resetTime: resetTime ? parseInt(resetTime, 10) : null
    };

    window.dispatchEvent(new CustomEvent("aida_credits_updated", { detail }));
    window.dispatchEvent(new Event("storage"));
    return detail;
  } catch (err) {
    console.warn("consumeCredit warning:", err);
  }
}

/**
 * Refills credits and resets tokens back to full capacity
 */
export function resetCredits() {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("aida_credits", String(DEFAULT_CREDITS));
    localStorage.setItem("aida_used_tokens", "0");
    localStorage.removeItem("aida_token_reset_time");

    const detail = {
      credits: DEFAULT_CREDITS,
      usedTokens: 0,
      resetTime: null
    };

    window.dispatchEvent(new CustomEvent("aida_credits_updated", { detail }));
    window.dispatchEvent(new Event("storage"));
    return detail;
  } catch (err) {
    console.warn("resetCredits warning:", err);
  }
}

// Attach globally for window access
if (typeof window !== "undefined") {
  window.consumeCredit = consumeCredit;
  window.resetCredits = resetCredits;
  window.getCreditsInfo = getCreditsInfo;
}

/**
 * React hook to observe and control credits across any component
 */
export function useCredits() {
  const [info, setInfo] = useState(() => getCreditsInfo());

  const sync = useCallback(() => {
    setInfo(getCreditsInfo());
  }, []);

  useEffect(() => {
    sync();

    const handleCustom = (e) => {
      if (e?.detail) {
        setInfo(prev => ({
          ...prev,
          credits: typeof e.detail.credits === "number" ? e.detail.credits : prev.credits,
          usedTokens: typeof e.detail.usedTokens === "number" ? e.detail.usedTokens : prev.usedTokens,
          resetTime: e.detail.resetTime ?? prev.resetTime
        }));
      } else {
        sync();
      }
    };

    window.addEventListener("aida_credits_updated", handleCustom);
    window.addEventListener("storage", sync);

    // Periodic check for 5-hour cooldown auto-reset
    const interval = setInterval(() => {
      const resetTimeStr = localStorage.getItem("aida_token_reset_time");
      if (resetTimeStr && Date.now() >= parseInt(resetTimeStr, 10)) {
        resetCredits();
      }
    }, 10000);

    return () => {
      window.removeEventListener("aida_credits_updated", handleCustom);
      window.removeEventListener("storage", sync);
      clearInterval(interval);
    };
  }, [sync]);

  return {
    ...info,
    consume: consumeCredit,
    reset: resetCredits,
    refresh: sync
  };
}
