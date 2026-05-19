"use client";

import { useEffect } from "react";
import { applyThemePreference, normalizeThemePreference, THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeBoot() {
  useEffect(() => {
    applyThemePreference(normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY)));
  }, []);

  return null;
}
