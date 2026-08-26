"use client";

// ============================================================
//  app/admin/adminData.ts
//  Ma'lumotро az backend meghundorem va baroi grafikho
//  tayyor mekunem. Hama az api.* (proxy-i mo) meguzarad.
// ============================================================
import { api } from "@/lib/api";
import type { Post, Reel, Story, User } from "@/lib/types";

export type Dash = {
  users: User[];
  posts: Post[];
  reels: Reel[];
  stories: Story[];
  totalUsers: number;
};

/** Hamai sahifahoi yak so-rovi sahifabandiшуда. */
async function fetchAllPages<T>(
  load: (page: number) => Promise<{ data: T[]; totalPages?: number }>,
  cap = 20,
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  let pages = 1;

  do {
    const res = await load(page);
    const list = res.data ?? [];
    out.push(...list);
    pages = res.totalPages ?? 1;
    page += 1;
    if (list.length === 0) break;
  } while (page <= pages && page <= cap);

  return out;
}

export async function loadDashboard(): Promise<Dash> {
  // Korbaron - HAMAI sahifaho (odaton 1-2 sahifa).
  const usersEnv = await api.users({ page: 1, pageSize: 50 });
  const totalUsers = usersEnv.totalRecords ?? usersEnv.data?.length ?? 0;
  let users = usersEnv.data ?? [];

  if (users.length < totalUsers) {
    const rest = await fetchAllPages<User>(
      async (page) => {
        const env = await api.users({ page, pageSize: 50 });
        return { data: env.data ?? [], totalPages: env.totalPages };
      },
    );
    if (rest.length > users.length) users = rest;
  }

  // Postho, reelho, storyho - baroi grafiki afzoиш.
  const [posts, reels, stories] = await Promise.all([
    fetchAllPages<Post>(async (page) => {
      const env = await api.posts({ page, pageSize: 50 });
      return { data: env.data ?? [], totalPages: env.totalPages };
    }).catch(() => [] as Post[]),
    fetchAllPages<Reel>(async (page) => {
      const env = await api.reels({ page, pageSize: 50 });
      return { data: env.data ?? [], totalPages: env.totalPages };
    }).catch(() => [] as Reel[]),
    api
      .stories()
      .then((e) => e.data ?? [])
      .catch(() => [] as Story[]),
  ]);

  return { users, posts, reels, stories, totalUsers };
}

// ------------------------------------------------------------
//  Grafik: afzoиши kontent dar 14 ruzi okhir.
//  Har nuqta = shumorai post + reel dar hamon ruz.
// ------------------------------------------------------------
export type DayPoint = { label: string; date: string; posts: number; reels: number };

export function contentByDay(
  posts: Post[],
  reels: Reel[],
  days = 14,
): DayPoint[] {
  const now = new Date();
  const buckets: DayPoint[] = [];
  const index = new Map<string, DayPoint>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const point: DayPoint = {
      date: key,
      label: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      posts: 0,
      reels: 0,
    };
    buckets.push(point);
    index.set(key, point);
  }

  const add = (iso: string | null | undefined, field: "posts" | "reels") => {
    if (!iso) return;
    const key = iso.slice(0, 10);
    const p = index.get(key);
    if (p) p[field] += 1;
  };

  for (const p of posts) add(p.datePublished, "posts");
  for (const r of reels) add(r.datePublished, "reels");

  return buckets;
}

/** Afzoиши JAMъBASTAI kontent (bо ҳам) - baroi grafiki maydon. */
export function cumulativeContent(day: DayPoint[]): { label: string; value: number }[] {
  let sum = 0;
  return day.map((d) => {
    sum += d.posts + d.reels;
    return { label: d.label, value: sum };
  });
}
