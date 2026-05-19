"use client";

import { useEffect } from "react";

type ThemeApplierProps = {
  theme: "light" | "dark";
};

export function ThemeApplier({ theme }: ThemeApplierProps) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
