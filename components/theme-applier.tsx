"use client";

import { useEffect } from "react";
import { applyThemePreference, normalizeThemePreference, THEME_STORAGE_KEY } from "@/lib/theme";

type ThemeApplierProps = {
  theme: "light" | "dark";
};

export function ThemeApplier({ theme }: ThemeApplierProps) {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const normalizedTheme = normalizeThemePreference(storedTheme || theme);
    applyThemePreference(normalizedTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  }, [theme]);

  return null;
}
