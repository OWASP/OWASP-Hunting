"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  type ThemePreference,
  THEME_EVENT,
  resolveTheme,
  nextThemePreference,
  getThemePreference,
  setThemePreference,
} from "@/lib/theme";

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
    const pref = getThemePreference();
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
  const preference = useSyncExternalStore(subscribe, getThemePreference, getServerSnapshot);
  const next = nextThemePreference(preference);

  const toggle = () => {
    const prefersLight =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: light)").matches
        : false;
    const resolved = resolveTheme(next, prefersLight);
    document.documentElement.setAttribute("data-theme", resolved);
    setThemePreference(next);
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
