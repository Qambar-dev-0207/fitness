"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light/dark mode"
      className="theme-toggle-btn"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark"
        ? <Sun size={14} className="text-gold-leaf" />
        : <Moon size={14} className="text-gold-leaf" />
      }
    </button>
  );
}
