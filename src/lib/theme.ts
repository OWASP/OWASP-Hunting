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
