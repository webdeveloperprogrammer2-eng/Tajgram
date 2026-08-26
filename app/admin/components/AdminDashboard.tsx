"use client";

// ============================================================
//  AdminDashboard - сафҳаи асосии панели админ.
//  Grafikҳо + KPI + тугмаи «Корбарон» (кунҷи рост-поён).
// ============================================================
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Grid3x3,
  Clapperboard,
  CircleDot,
  ShieldBan,
  MessageSquareWarning,
  TrendingUp,
  LogOut,
  Loader2,
} from "lucide-react";

import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { loadDashboard, contentByDay, cumulativeContent, type Dash } from "../adminData";
import {
  fetchBans,
  fetchComplaintCounts,
  createBan,
  deleteBan,
  type Ban,
} from "../adminApi";
import { api } from "@/lib/api";
import { AreaChart, BarGroups, Donut } from "./Charts";
import { UsersPanel } from "./UsersPanel";
import { UserModal } from "./UserModal";

export function AdminDashboard() {
  const [dash, setDash] = useState<Dash | null>(null);
  const [bans, setBans] = useState<Record<string, Ban>>({});
  const [complaintCounts, setComplaintCounts] = useState<Record<string, number>>(
    {},
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const [active, setActive] = useState<User | null>(null);

  useEffect(() => {
    loadDashboard().then(setDash).catch(() => setDash(null));
    fetchBans()
      .then((list) =>
        setBans(Object.fromEntries(list.map((b) => [b.userId, b]))),
      )
      .catch(() => {});
    fetchComplaintCounts()
      .then(setComplaintCounts)
      .catch(() => {});
  }, []);

  const days = useMemo(
    () => (dash ? contentByDay(dash.posts, dash.reels, 14) : []),
    [dash],
  );
  const cumulative = useMemo(() => cumulativeContent(days), [days]);

  const banCount = Object.keys(bans).length;
  const complaintTotal = Object.values(complaintCounts).reduce((s, n) => s + n, 0);

  // --- Amalҳои ban/delete (ба UserModal мераванд) ---
  async function handleBan(u: User, until: number | null, reason: string) {
    const ban = await createBan({
      userId: u.userId,
      userName: u.userName,
      fullName: u.fullName,
      reason,
      until,
    });
    setBans((prev) => ({ ...prev, [u.userId]: ban }));
  }

  async function handleUnban(u: User) {
    await deleteBan(u.userId);
    setBans((prev) => {
      const next = { ...prev };
      delete next[u.userId];
      return next;
    });
  }

  async function handleDelete(u: User) {
    await api.deleteUser(u.userId);
    // Аз рӯйхат мебарорем
    setDash((prev) =>
      prev
        ? { ...prev, users: prev.users.filter((x) => x.userId !== u.userId), totalUsers: prev.totalUsers - 1 }
        : prev,
    );
    setActive(null);
  }

  const kpis = [
    { icon: Users, label: "Корбарон", value: dash?.totalUsers ?? "—", tone: "var(--accentA)" },
    { icon: Grid3x3, label: "Постҳо", value: dash?.posts.length ?? "—", tone: "var(--accentB)" },
    { icon: Clapperboard, label: "Reels", value: dash?.reels.length ?? "—", tone: "#0aa5ff" },
    { icon: CircleDot, label: "Сторис", value: dash?.stories.length ?? "—", tone: "#12b886" },
    { icon: ShieldBan, label: "Банҳо", value: banCount, tone: "var(--danger)" },
    { icon: MessageSquareWarning, label: "Шикоятҳо", value: complaintTotal, tone: "var(--gold)" },
  ];

  const donutSlices = dash
    ? [
        { label: "Постҳо", value: dash.posts.length, color: "var(--accentA)" },
        { label: "Reels", value: dash.reels.length, color: "var(--accentB)" },
        { label: "Сторис", value: dash.stories.length, color: "#12b886" },
      ]
    : [];

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      {/* --- Сарлавҳа --- */}
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{ borderColor: "var(--line)", background: "var(--glass)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(135deg,var(--accentA),var(--accentB))" }}
          >
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="mr-auto">
            <h1 className="text-lg font-extrabold leading-none text-[var(--fg)]">
              Tajgram Admin
            </h1>
            <p className="text-xs text-[var(--muted)]">Панели идоракунӣ</p>
          </div>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold text-[var(--fg)] transition hover:bg-[var(--panel)]"
            style={{ borderColor: "var(--lineStrong)" }}
          >
            <LogOut className="h-4 w-4" /> Баромад
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">
        {/* --- KPI --- */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="rounded-2xl border p-4"
                style={{ borderColor: "var(--line)", background: "var(--panel)" }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: k.tone, color: "#fff" }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="mt-3 text-2xl font-extrabold text-[var(--fg)]">
                  {dash === null && typeof k.value !== "number" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />
                  ) : (
                    k.value
                  )}
                </div>
                <div className="text-xs font-medium text-[var(--muted)]">
                  {k.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* --- Grafikҳо --- */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="Афзоиши контент"
            subtitle="Ҷамъбасти пост + reels дар 14 рӯзи охир"
          >
            {dash ? <AreaChart data={cumulative} /> : <ChartSkeleton />}
          </ChartCard>

          <ChartCard title="Тақсими контент" subtitle="Аз рӯи навъ">
            {dash ? (
              <div className="flex h-full items-center justify-center py-2">
                <Donut slices={donutSlices} />
              </div>
            ) : (
              <ChartSkeleton />
            )}
          </ChartCard>

          <ChartCard
            className="lg:col-span-3"
            title="Фаъолият аз рӯи рӯз"
            subtitle="Постҳо (гулобӣ) ва reels (бунафш)"
          >
            {dash ? <BarGroups data={days} /> : <ChartSkeleton />}
          </ChartCard>
        </div>
      </main>

      {/* --- Тугмаи шинокунандаи «Корбарон» (кунҷи рост-поён) --- */}
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition hover:brightness-110 active:scale-95"
        style={{ background: "linear-gradient(135deg,var(--accentA),var(--accentB))" }}
      >
        <Users className="h-5 w-5" />
        Корбарон
        {dash && (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
            {dash.totalUsers}
          </span>
        )}
      </button>

      {panelOpen && (
        <UsersPanel
          users={dash?.users ?? []}
          bans={bans}
          complaintCounts={complaintCounts}
          loading={dash === null}
          onClose={() => setPanelOpen(false)}
          onPick={(u) => setActive(u)}
        />
      )}

      {active && (
        <UserModal
          key={active.userId}
          userId={active.userId}
          userName={active.userName}
          ban={bans[active.userId] ?? null}
          complaintCount={complaintCounts[active.userId] ?? 0}
          onClose={() => setActive(null)}
          onBan={(until, reason) => handleBan(active, until, reason)}
          onUnban={() => handleUnban(active)}
          onDelete={() => handleDelete(active)}
        />
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 ${className}`}
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <h2 className="text-base font-bold text-[var(--fg)]">{title}</h2>
      <p className="mb-3 text-xs text-[var(--muted)]">{subtitle}</p>
      {children}
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[220px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
    </div>
  );
}
