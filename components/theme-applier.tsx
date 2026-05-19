"use client";

import { useEffect } from "react";
import { applyThemePreference, normalizeThemePreference, THEME_STORAGE_KEY } from "@/lib/theme";

type ThemeApplierProps = {
  theme: "light" | "dark";
};

export function ThemeApplier({ theme }: ThemeApplierProps) {
  useEffect(() => {
    const normalizedTheme = normalizeThemePreference(theme);
    applyThemePreference(normalizedTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  }, [theme]);

  return null;
}
