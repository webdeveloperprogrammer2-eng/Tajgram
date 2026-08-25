"use client";

// ============================================================
//  Tugmai ivazi naql: TORIK <-> RAVSHAN
// ============================================================
import { Moon, Sun } from "lucide-react";

import { useSettings } from "../providers";
import { Button } from "../ui/button";

export default function ThemeToggle() {
  const { theme, toggleTheme, t } = useSettings();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t.theme}
      className="h-10 w-10 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--fg)] hover:bg-[var(--panelSoft)] hover:text-[var(--gold)] transition-colors duration-200"
    >
      {isDark ? (
        <Sun className="h-4.5 w-4.5" strokeWidth={1.5} />
      ) : (
        <Moon className="h-4.5 w-4.5" strokeWidth={1.5} />
      )}
    </Button>
  );
}
