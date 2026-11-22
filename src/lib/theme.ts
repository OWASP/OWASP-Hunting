export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_EVENT = "themechange";
export const THEME_STORAGE_KEY = "theme";

/**
 * Resolves the effective theme ("light" | "dark") from the stored preference
 * and the operating system's color scheme preference.
 *
 * Rules:
 * - "light" -> always "light"
 * - "dark" -> always "dark"
 * - "system" (or no preference stored yet) -> follows system preference:
 *   "light" if prefersLight is true, otherwise dark default.
 */
export function resolveTheme(
  stored: string | null | undefined,
  prefersLight: boolean
): ResolvedTheme {
  if (stored === "light") return "light";
  if (stored === "dark") return "dark";
  return prefersLight ? "light" : "dark";
}

let inMemoryPreference: ThemePreference | null = null;

/**
 * Retrieves the current theme preference ("system" | "light" | "dark").
 * Reads from storage (defaulting to window.localStorage). If storage is
 * unavailable or throws, falls back to the in-memory preference, or "system".
 */
export function getThemePreference(storage?: Pick<Storage, "getItem"> | null): ThemePreference {
  try {
    const s =
      storage !== undefined
        ? storage
        : typeof window !== "undefined"
          ? window.localStorage
          : null;
    const t = s?.getItem(THEME_STORAGE_KEY);
    if (t === "light" || t === "dark" || t === "system") {
      inMemoryPreference = t;
      return t;
    }
  } catch {
    // Storage access might be blocked
  }
  return inMemoryPreference ?? "system";
}

/**
 * Saves the theme preference. Updates the in-memory preference so that
 * if storage is blocked/throws, the selection persists in-memory for the session.
 */
export function setThemePreference(
  pref: ThemePreference,
  storage?: Pick<Storage, "setItem"> | null
): void {
  inMemoryPreference = pref;
  try {
    const s =
      storage !== undefined
        ? storage
        : typeof window !== "undefined"
          ? window.localStorage
          : null;
    s?.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage can be blocked; inMemoryPreference preserves the selection.
  }
}

/**
 * Resets the in-memory preference (primarily used in tests).
 */
export function resetInMemoryThemePreference(): void {
  inMemoryPreference = null;
}

/**
 * Returns the next theme preference in the 3-state cycle:
 * system -> light -> dark -> system
 */
export function nextThemePreference(current: ThemePreference): ThemePreference {
  switch (current) {
    case "system":
      return "light";
    case "light":
      return "dark";
    case "dark":
      return "system";
  }
}
