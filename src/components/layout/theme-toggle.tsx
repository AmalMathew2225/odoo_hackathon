"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");

    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);

    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  return (
    <button
      onClick={toggleTheme}
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      aria-label="Toggle display theme"
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
    >
      {theme === "light" ? (
        <Moon className="h-3.5 w-3.5 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-3.5 w-3.5 transition-transform duration-200 hover:rotate-45" />
      )}
    </button>
  );
}
