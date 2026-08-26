"use client";

// ============================================================
//  UsersPanel - рӯйхати ҲАМАИ корбарони сайт (overlay).
//  Ҷустуҷӯ + нишонаҳои бан/шикоят. Клик -> UserModal.
// ============================================================
import { useMemo, useState } from "react";
import {
  X,
  Search,
  ShieldBan,
  MessageSquareWarning,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { mediaUrl } from "@/lib/api";
import type { User } from "@/lib/types";
import type { Ban } from "../adminApi";

export function UsersPanel({
  users,
  bans,
  complaintCounts,
  loading,
  onClose,
  onPick,
}: {
  users: User[];
  bans: Record<string, Ban>;
  complaintCounts: Record<string, number>;
  loading: boolean;
  onClose: () => void;
  onPick: (u: User) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.userName.toLowerCase().includes(s) ||
        (u.fullName ?? "").toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s),
    );
  }, [q, users]);

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l shadow-2xl"
        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Сарлавҳа */}
        <div
          className="flex items-center gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="mr-auto">
            <h2 className="text-lg font-extrabold text-[var(--fg)]">Корбарон</h2>
            <p className="text-xs text-[var(--muted)]">{users.length} нафар</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--panel)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ҷустуҷӯ */}
        <div className="px-5 py-3">
          <div
            className="flex items-center gap-2 rounded-full border px-4 py-2.5"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <Search className="h-4 w-4 text-[var(--muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ном, username, email…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>
        </div>

        {/* Рӯйхат */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--muted)]">
              Ҳеҷ чиз ёфт нашуд
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((u) => {
                const img = mediaUrl(u.image);
                const banned = !!bans[u.userId];
                const complaints = complaintCounts[u.userId] ?? 0;
                return (
                  <li key={u.userId}>
                    <button
                      onClick={() => onPick(u)}
                      className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition hover:bg-[var(--panel)]"
                    >
                      <div
                        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full"
                        style={{ background: "var(--panel)" }}
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-bold text-[var(--muted)]">
                            {u.userName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-[var(--fg)]">
                            {u.fullName || u.userName}
                          </p>
                          {banned && (
                            <ShieldBan className="h-3.5 w-3.5 shrink-0 text-[var(--danger)]" />
                          )}
                        </div>
                        <p className="truncate text-xs text-[var(--muted)]">
                          @{u.userName}
                        </p>
                      </div>

                      {complaints > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
                          style={{
                            background: "var(--goldSoft)",
                            color: "var(--gold)",
                          }}
                        >
                          <MessageSquareWarning className="h-3 w-3" />
                          {complaints}
                        </span>
                      )}

                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
