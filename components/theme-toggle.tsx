"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span aria-hidden="true" className="block size-9" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative grid size-9 place-items-center rounded-card text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all duration-200"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun aria-hidden="true" size={18} className="text-amber-400 rotate-0 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon aria-hidden="true" size={18} className="text-teal-700 rotate-0 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}