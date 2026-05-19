"use client";

import { useEffect, useState } from "react";
import type { ThemePreference } from "@/lib/profiles";
import { applyThemePreference, normalizeThemePreference, THEME_STORAGE_KEY } from "@/lib/theme";

type ThemeSelectProps = {
  defaultValue: ThemePreference;
};

export function ThemeSelect({ defaultValue }: ThemeSelectProps) {
  const [theme, setTheme] = useState<ThemePreference>(() => normalizeThemePreference(defaultValue));

  useEffect(() => {
    applyThemePreference(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleChange(value: string) {
    const nextTheme = normalizeThemePreference(value);
    setTheme(nextTheme);
    applyThemePreference(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  return (
    <select name="theme_preference" onChange={(event) => handleChange(event.target.value)} value={theme}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
