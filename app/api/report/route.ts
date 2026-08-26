// ============================================================
//  POST /api/report   (барои корбарони ОДДӢ)
//
//  Ҳар корбари даромада метавонад ба корбари дигар «жалоба»
//  диҳад. Шикоят дар store-и админ (.data/admin.json) сабт
//  мешавад ва дар панели /admin зери ҳамон корбар пайдо мешавад.
//
//  DIQQAT: хондан/нест кардани шикоятҳо ФАҚАТ аз тарафи админ
//  аст (app/api/admin/complaints). Ин ҷо танҳо ГУЗОШТАН.
// ============================================================
import type { NextRequest } from "next/server";

import { decodeJwt } from "@/lib/adminAuth";
import { addComplaint, type Complaint } from "@/lib/adminStore";

function bearerOf(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (raw === null || !raw.toLowerCase().startsWith("bearer ")) return null;
  const value = raw.slice(7).trim();
  return value === "" ? null : value;
}

export async function POST(request: NextRequest) {
  const token = bearerOf(request);
  const reporter = token ? decodeJwt(token) : null;

  // Танҳо корбари даромада шикоят карда метавонад.
  if (reporter === null || !reporter.userName) {
    return Response.json(
      { error: "Аввал ба аккаунт дароед." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  let body: { targetUserId?: string; text?: string };
  try {
    body = (await request.json()) as { targetUserId?: string; text?: string };
  } catch {
    return Response.json({ error: "JSON нодуруст" }, { status: 400 });
  }

  const targetUserId = body.targetUserId?.trim();
  const text = body.text?.trim();

  if (!targetUserId || !text) {
    return Response.json(
      { error: "targetUserId ва text лозим аст" },
      { status: 400 },
    );
  }

  // Худ ба худ шикоят кардан бемаънист.
  if (targetUserId === reporter.sub) {
    return Response.json(
      { error: "Ба худатон шикоят карда наметавонед." },
      { status: 400 },
    );
  }

  const complaint: Complaint = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    by: `@${reporter.userName}`,
    text,
    createdAt: Date.now(),
  };

  await addComplaint(targetUserId, complaint);

  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
