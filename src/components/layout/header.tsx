"use client";

import React from "react";
import { ThemeToggle } from "./theme-toggle";
import type { UserRole } from "@/types/database";

interface HeaderProps {
  role: UserRole;
  userEmail: string;
}

export function Header({ role, userEmail }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono">
          SYSTEM ENVIRONMENT
        </span>
        <span className="text-xs text-neutral-300 dark:text-neutral-700">/</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
          {role} SESSION
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
          {userEmail}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
