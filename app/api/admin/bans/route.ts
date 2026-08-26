// ============================================================
//  /api/admin/bans     (FAQAT admin)
//
//  GET    -> ruyxati hamai ban-hoi zinda
//  POST   -> ban guzoshtan  { userId, userName, fullName, reason, until }
//  DELETE -> ban bardoshtan ?userId=...
// ============================================================
import type { NextRequest } from "next/server";

import { isAdminRequest } from "@/lib/adminAuth";
import { listBans, setBan, removeBan, type Ban } from "@/lib/adminStore";

function forbidden() {
  return Response.json(
    { error: "Faqat admin" },
    { status: 403, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return forbidden();
  const bans = await listBans();
  return Response.json({ bans }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return forbidden();

  let body: Partial<Ban>;
  try {
    body = (await request.json()) as Partial<Ban>;
  } catch {
    return Response.json({ error: "JSON нодуруст" }, { status: 400 });
  }

  if (!body.userId) {
    return Response.json({ error: "userId lozim ast" }, { status: 400 });
  }

  const ban: Ban = {
    userId: body.userId,
    userName: body.userName ?? "",
    fullName: body.fullName ?? "",
    reason: body.reason ?? "",
    until:
      typeof body.until === "number" && Number.isFinite(body.until)
        ? body.until
        : null,
    createdAt: Date.now(),
  };

  await setBan(ban);
  return Response.json({ ban }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return forbidden();

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId lozim ast" }, { status: 400 });
  }

  await removeBan(userId);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
