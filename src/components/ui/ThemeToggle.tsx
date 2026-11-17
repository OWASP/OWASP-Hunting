"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  type ThemePreference,
  THEME_EVENT,
  THEME_STORAGE_KEY,
  resolveTheme,
  nextThemePreference,
} from "@/lib/theme";

function getPreference(): ThemePreference {
  try {
    const t = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (t === "light" || t === "dark" || t === "system") {
      return t;
    }
  } catch {
    // Storage access might be blocked
  }
  return "system";
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  const mql =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: light)")
      : null;
  const handleMediaChange = (e: MediaQueryListEvent) => {
    const pref = getPreference();
    if (pref === "system") {
      document.documentElement.setAttribute("data-theme", e.matches ? "light" : "dark");
      window.dispatchEvent(new Event(THEME_EVENT));
    }
  };
  mql?.addEventListener("change", handleMediaChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    mql?.removeEventListener("change", handleMediaChange);
  };
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribe, getPreference, getServerSnapshot);
  const next = nextThemePreference(preference);

  const toggle = () => {
    const prefersLight =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: light)").matches
        : false;
    const resolved = resolveTheme(next, prefersLight);
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice still holds for this page view.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const nextLabel = `Switch to ${next} theme`;
  const tooltip = `Theme: ${preference} (${nextLabel})`;

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-button"
      aria-label={nextLabel}
      title={tooltip}
    >
      {preference === "system" ? (
        <Monitor size={18} aria-hidden />
      ) : preference === "light" ? (
        <Sun size={18} aria-hidden />
      ) : (
        <Moon size={18} aria-hidden />
      )}
    </button>
  );
}
