"use client";

// ============================================================
//  Intikhobi zabon - menyui shadcn (DropdownMenu)
// ============================================================
import { LANGS } from "../i18n";
import { useSettings } from "../providers";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";

export default function LangSwitch() {
  const { lang, changeLang, t } = useSettings();

  const current = LANGS.find((item) => item.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t.language}
          className="tracking-[0.28em] hover:text-[var(--gold)]"
        >
          {current?.short}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {LANGS.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => changeLang(item.code)}
            style={{ color: item.code === lang ? "var(--gold)" : undefined }}
          >
            <span>{item.label}</span>
            {item.code === lang && (
              <span
                className="h-1 w-1 rotate-45"
                style={{ background: "var(--gold)" }}
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
