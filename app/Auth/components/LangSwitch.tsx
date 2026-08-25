"use client";

// ============================================================
//  Intikhobi zabon - menyui shadcn (DropdownMenu)
// ============================================================
import { Globe, ChevronDown } from "lucide-react";
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
          className="flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 text-[13px] font-semibold text-[var(--fg)] hover:bg-[var(--panelSoft)] hover:text-[var(--gold)] transition-colors duration-200"
        >
          <Globe className="h-4 w-4 opacity-70" />
          <span>{current?.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-55" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[140px]">
        {LANGS.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => changeLang(item.code)}
            className="flex items-center justify-between py-2 px-3 hover:bg-[var(--panelSoft)]"
            style={{ color: item.code === lang ? "var(--gold)" : undefined }}
          >
            <span className="font-medium">{item.label}</span>
            {item.code === lang && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--gold)" }}
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
