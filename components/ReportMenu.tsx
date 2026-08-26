"use client";

// ============================================================
//  ReportMenu - менюи «...»-и пост.
//  Варианти «Жалоба» -> модалка бо сабабҳо -> /api/report.
//  Шикоят дар панели /admin зери сохиби пост пайдо мешавад.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Flag, X, Check, Loader2 } from "lucide-react";

import { getToken } from "@/lib/auth";
import { DotsIcon } from "./icons";

const REASONS = [
  "Спам ё реклама",
  "Мазмуни номуносиб",
  "Таҳқир ё нафрат",
  "Маълумоти бардурӯғ",
  "Дигар сабаб",
];

export function ReportMenu({
  targetUserId,
  targetUserName,
  ariaLabel,
}: {
  targetUserId: string;
  targetUserName: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Пӯшидан ҳангоми клики берун
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label={ariaLabel ?? "Бештар"}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-1.5 text-[var(--fg)] transition-colors hover:bg-[var(--panel)]"
      >
        <DotsIcon size={20} />
      </button>

      {open && (
        <div
          className="animate-menu-in absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-2xl border py-1 shadow-xl"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setModal(true);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[var(--panel)]"
            style={{ color: "var(--danger)" }}
          >
            <Flag className="h-4 w-4" /> Жалоба
          </button>
        </div>
      )}

      {modal && (
        <ReportModal
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}

function ReportModal({
  targetUserId,
  targetUserName,
  onClose,
}: {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const text = note.trim() ? `${reason} — ${note.trim()}` : reason;
      const token = getToken();
      const res = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetUserId, text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хатогӣ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-sm rounded-3xl border p-6 shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--okSoft)", color: "var(--ok)" }}
            >
              <Check className="h-7 w-7" />
            </span>
            <p className="text-base font-bold text-[var(--fg)]">
              Жалоба фиристода шуд
            </p>
            <p className="text-sm text-[var(--muted)]">
              Раҳмат. Админ онро мебинад.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "var(--dangerSoft)", color: "var(--danger)" }}
              >
                <Flag className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-[var(--fg)]">Жалоба</h3>
                <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                  @{targetUserName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--panel)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-1.5">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all"
                  style={{
                    borderColor: reason === r ? "var(--danger)" : "var(--line)",
                    background:
                      reason === r ? "var(--dangerSoft)" : "transparent",
                    color: reason === r ? "var(--danger)" : "var(--fg)",
                  }}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor:
                        reason === r ? "var(--danger)" : "var(--lineStrong)",
                    }}
                  >
                    {reason === r && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: "var(--danger)" }}
                      />
                    )}
                  </span>
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Тавзеҳи иловагӣ (ихтиёрӣ)…"
              className="mt-3 w-full resize-none rounded-xl border bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--lineStrong)]"
              style={{ borderColor: "var(--line)" }}
            />

            {error && (
              <p className="mt-2 text-sm font-medium text-[var(--danger)]">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={onClose}
                disabled={busy}
                className="flex-1 rounded-full border py-3 text-sm font-semibold text-[var(--fg)] disabled:opacity-50"
                style={{ borderColor: "var(--lineStrong)" }}
              >
                Бекор
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "var(--danger)" }}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Фиристодан
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
