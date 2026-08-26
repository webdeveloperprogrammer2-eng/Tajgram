"use client";

// ============================================================
//  app/admin/adminApi.ts
//  Ban va shikoyat (zhaloba) - so-rov ba /api/admin/*.
//  Hamai inho token-i admin-ро dar sarlavha mefiristand.
// ============================================================
import { getToken } from "@/lib/auth";

export type Ban = {
  userId: string;
  userName: string;
  fullName: string;
  reason: string;
  until: number | null;
  createdAt: number;
};

export type Complaint = {
  id: string;
  by: string;
  text: string;
  createdAt: number;
};

function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  const t = getToken();
  if (t !== null) h.Authorization = `Bearer ${t}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data;
}

// --- Ban ---

export async function fetchBans(): Promise<Ban[]> {
  const res = await fetch("/api/admin/bans", {
    headers: authHeaders(),
    cache: "no-store",
  });
  return (await readJson<{ bans: Ban[] }>(res)).bans;
}

export async function createBan(input: {
  userId: string;
  userName: string;
  fullName: string;
  reason: string;
  until: number | null;
}): Promise<Ban> {
  const res = await fetch("/api/admin/bans", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(input),
  });
  return (await readJson<{ ban: Ban }>(res)).ban;
}

export async function deleteBan(userId: string): Promise<void> {
  const res = await fetch(
    `/api/admin/bans?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE", headers: authHeaders() },
  );
  await readJson(res);
}

// --- Shikoyat ---

export async function fetchComplaintCounts(): Promise<Record<string, number>> {
  const res = await fetch("/api/admin/complaints", {
    headers: authHeaders(),
    cache: "no-store",
  });
  return (await readJson<{ counts: Record<string, number> }>(res)).counts;
}

export async function fetchComplaints(userId: string): Promise<Complaint[]> {
  const res = await fetch(
    `/api/admin/complaints?userId=${encodeURIComponent(userId)}`,
    { headers: authHeaders(), cache: "no-store" },
  );
  return (await readJson<{ complaints: Complaint[] }>(res)).complaints;
}

export async function addComplaint(
  userId: string,
  text: string,
): Promise<Complaint[]> {
  const res = await fetch("/api/admin/complaints", {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ userId, text }),
  });
  return (await readJson<{ complaints: Complaint[] }>(res)).complaints;
}

export async function deleteComplaint(
  userId: string,
  id: string,
): Promise<Complaint[]> {
  const res = await fetch(
    `/api/admin/complaints?userId=${encodeURIComponent(
      userId,
    )}&id=${encodeURIComponent(id)}`,
    { method: "DELETE", headers: authHeaders() },
  );
  return (await readJson<{ complaints: Complaint[] }>(res)).complaints;
}

// --- Kumak: matni muddati ban ---

export function banRemaining(until: number | null): string {
  if (until === null) return "hamesha";
  const ms = until - Date.now();
  if (ms <= 0) return "tamom shud";

  const min = Math.floor(ms / 60_000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d} ruz ${h % 24} soat`;
  if (h > 0) return `${h} soat ${min % 60} daq`;
  return `${min} daqiqa`;
}
