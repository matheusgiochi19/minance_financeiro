import type { ThemePreference } from "@/lib/profiles";

export const THEME_STORAGE_KEY = "minance-theme";

export function normalizeThemePreference(value: unknown): ThemePreference {
  return value === "dark" ? "dark" : "light";
}

export function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
}
