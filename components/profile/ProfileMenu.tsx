"use client";

// ============================================================
//  ProfileMenu - tugmai "⋯" dar sari profili korbari DIGAR.
//
//  Daruni on hozir YAK amal ast: BLOK.
//
//  MUHIM: blok SHAKHSIST. On faqat ba MAN daxl dorad -
//  ba'di bastan man posthoi uro dar lenta namebinam va u ba
//  man navishta nametavonad. Ba KHUDI u hech chiz namoyon
//  nameshavad va hech kasi digar inro namebinad (instagram
//  ham hamin tavr mekunad).
//
//  Baroi hamin ro-ykhat dar /api/block-i KHUDAMON ast
//  (lib/blockStore.ts), na dar profili umumii backend.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Ban, Loader2, ShieldOff } from "lucide-react";

import { useT } from "@/components/LocaleProvider";
import { DotsIcon } from "@/components/icons";
import { blockUser, unblockUser } from "@/lib/blocks";

export function ProfileMenu({
  user,
  blocked,
}: {
  user: {
    userId: string;
    userName: string;
    fullName: string;
    image: string | null;
  };
  /** Man uro allakay bastaam? */
  blocked: boolean;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Zadan ba beruni menyu -> pushida meshavad.
  useEffect(() => {
    if (!open) return;

    const onDoc = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
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
        aria-label={t.moreOptions}
        title={t.moreOptions}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--fg)] transition-all duration-200 hover:bg-[var(--panel)] active:scale-[0.97]"
      >
        <DotsIcon size={20} />
      </button>

      {open && (
        <div
          className="animate-menu-in absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-2xl border py-1 shadow-xl"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirm(true);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-[var(--panel)]"
            style={{ color: blocked ? "var(--fg)" : "var(--danger)" }}
          >
            {blocked ? (
              <>
                <ShieldOff className="h-4 w-4" /> {t.unblock}
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" /> {t.blockAction}
              </>
            )}
          </button>
        </div>
      )}

      {confirm && (
        <BlockConfirm
          user={user}
          blocked={blocked}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
//  Pursish - to tasodufan naparad.
// ------------------------------------------------------------
function BlockConfirm({
  user,
  blocked,
  onClose,
}: {
  user: {
    userId: string;
    userName: string;
    fullName: string;
    image: string | null;
  };
  blocked: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run() {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      if (blocked) await unblockUser(user.userId);
      else await blockUser(user);

      onClose();
    } catch {
      setError(t.blockFailed);
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
        className="animate-scale-in w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: blocked ? "var(--panel)" : "var(--dangerSoft)",
            color: blocked ? "var(--fg)" : "var(--danger)",
          }}
        >
          {blocked ? (
            <ShieldOff className="h-6 w-6" />
          ) : (
            <Ban className="h-6 w-6" />
          )}
        </span>

        <h3 className="mt-4 text-lg font-bold text-[var(--fg)]">
          {blocked ? t.unblockConfirmTitle : t.blockConfirmTitle}
        </h3>

        <p className="mt-1 truncate text-sm font-semibold text-[var(--muted)]">
          @{user.userName}
        </p>

        <p className="mt-3 text-sm leading-5 text-[var(--muted)]">
          {blocked ? t.unblockConfirmText : t.blockConfirmText}
        </p>

        {error !== null && (
          <p className="mt-3 text-sm font-medium text-[var(--danger)]">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-full border py-3 text-sm font-semibold text-[var(--fg)] disabled:opacity-50"
            style={{ borderColor: "var(--lineStrong)" }}
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: blocked ? "#0095f6" : "var(--danger)" }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {blocked ? t.unblock : t.blockAction}
          </button>
        </div>
      </div>
    </div>
  );
}
