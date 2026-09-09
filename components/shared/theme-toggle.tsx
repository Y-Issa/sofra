"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) return stored;
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe() {
  return () => {};
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  const initialTheme = useSyncExternalStore(subscribe, readInitialTheme, () => null);
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? initialTheme;

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  if (!theme) return <div className="size-9" aria-hidden="true" />;

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setOverride(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
