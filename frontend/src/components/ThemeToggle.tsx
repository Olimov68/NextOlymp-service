"use client";

import { Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "compact" | "sidebar";
}

// Faqat dark mode — dekorativ icon
export function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
  if (variant === "sidebar") {
    return (
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50 w-full ${className}`}>
        <Moon className="h-4 w-4" />
        Qorong&apos;u rejim
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground/50 ${className}`}
      title="Dark mode"
    >
      <Moon className="h-4 w-4" />
    </div>
  );
}
