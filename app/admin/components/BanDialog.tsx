"use client";

// ============================================================
//  BanDialog - modalkai guzoshtani ban bo MUDDAT.
//  Muddatro hisob mekunad va `until` (ms) bar megardonad.
// ============================================================
import { useState } from "react";
import { ShieldBan, X } from "lucide-react";

const PRESETS: { label: string; hours: number | null }[] = [
  { label: "1 соат", hours: 1 },
  { label: "24 соат", hours: 24 },
  { label: "7 рӯз", hours: 24 * 7 },
  { label: "30 рӯз", hours: 24 * 30 },
  { label: "Доимӣ", hours: null },
];

export function BanDialog({
  userName,
  busy,
  onCancel,
  onConfirm,
}: {
  userName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (until: number | null, reason: string) => void;
}) {
  const [choice, setChoice] = useState<number>(1); // index ба PRESETS
  const [reason, setReason] = useState("");

  function confirm() {
    const preset = PRESETS[choice];
    const until =
      preset.hours === null ? null : Date.now() + preset.hours * 3_600_000;
    onConfirm(until, reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl border p-6 shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--dangerSoft)", color: "var(--danger)" }}
          >
            <ShieldBan className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-[var(--fg)]">
              Бан кардани корбар
            </h3>
            <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
              @{userName}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--panel)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-[var(--muted)]">Муддат</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setChoice(i)}
              className="rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all"
              style={{
                borderColor: choice === i ? "var(--danger)" : "var(--line)",
                background:
                  choice === i ? "var(--dangerSoft)" : "var(--panel)",
                color: choice === i ? "var(--danger)" : "var(--fg)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-[var(--muted)]">
          Сабаб (ихтиёрӣ)
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Барои чӣ бан мешавад?"
          className="mt-2 w-full resize-none rounded-xl border bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--lineStrong)]"
          style={{ borderColor: "var(--line)" }}
        />

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-full border py-3 text-sm font-semibold text-[var(--fg)] disabled:opacity-50"
            style={{ borderColor: "var(--lineStrong)" }}
          >
            Бекор
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 rounded-full py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--danger)" }}
          >
            {busy ? "…" : "Бан кардан"}
          </button>
        </div>
      </div>
    </div>
  );
}
