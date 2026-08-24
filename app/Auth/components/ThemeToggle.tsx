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
      className="hover:text-[var(--gold)]"
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.3} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.3} />
      )}
    </Button>
  );
}
