"use client";

import { useEffect, useState, useTransition } from "react";
import { saveThemePreference } from "@/app/app/theme-actions";
import type { ThemePreference } from "@/lib/profiles";
import { applyThemePreference, normalizeThemePreference, THEME_STORAGE_KEY } from "@/lib/theme";

type ThemeSelectProps = {
  defaultValue: ThemePreference;
};

export function ThemeSelect({ defaultValue }: ThemeSelectProps) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return normalizeThemePreference(defaultValue);
    return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY) || defaultValue);
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    applyThemePreference(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleChange(value: string) {
    const nextTheme = normalizeThemePreference(value);
    const previousTheme = theme;
    setTheme(nextTheme);
    setMessage(null);
    applyThemePreference(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    startTransition(async () => {
      const result = await saveThemePreference(nextTheme);
      if (!result.ok) {
        setTheme(previousTheme);
        applyThemePreference(previousTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, previousTheme);
        setMessage(result.error);
        return;
      }
      setMessage("Tema salvo automaticamente.");
    });
  }

  return (
    <span className="theme-select-wrap">
      <select aria-busy={isPending} disabled={isPending} name="theme_preference" onChange={(event) => handleChange(event.target.value)} value={theme}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <small className={message?.includes("automaticamente") ? "theme-save-status success" : "theme-save-status"}>{isPending ? "Salvando tema..." : message}</small>
    </span>
  );
}
