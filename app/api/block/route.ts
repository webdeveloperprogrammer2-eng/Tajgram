// ============================================================
//  /api/block   - ro-ykhati "man kiro bastaam".
//
//    GET     -> ro-ykhati man
//    POST    -> bastan   { targetUserId, userName?, fullName?, image? }
//    DELETE  -> kushodan ?userId=...
//
//  Har se amal FAQAT ba ro-ykhati KHUDI so-rovkunanda daxl
//  dorad: "man" az token girifta meshavad, na az body. Baroi
//  hamin yak korbar ro-ykhati digarero ivaz karda NAMETAVONAD.
// ============================================================
import type { NextRequest } from "next/server";

import { decodeJwt } from "@/lib/adminAuth";
import {
  addBlock,
  listBlocked,
  removeBlock,
  type BlockedEntry,
} from "@/lib/blockStore";

const NO_STORE = { "cache-control": "no-store" };

function meOf(request: NextRequest): { id: string } | null {
  const raw = request.headers.get("authorization");
  if (raw === null || !raw.toLowerCase().startsWith("bearer ")) return null;

  const token = raw.slice(7).trim();
  if (token === "") return null;

  const payload = decodeJwt(token);
  if (payload === null || !payload.sub) return null;

  // Token guzashta -> "man" nest.
  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return { id: payload.sub };
}

function unauthorized() {
  return Response.json(
    { error: "Аввал ба аккаунт дароед." },
    { status: 401, headers: NO_STORE },
  );
}

export async function GET(request: NextRequest) {
  const me = meOf(request);
  if (me === null) return unauthorized();

  return Response.json(
    { data: await listBlocked(me.id) },
    { headers: NO_STORE },
  );
}

export async function POST(request: NextRequest) {
  const me = meOf(request);
  if (me === null) return unauthorized();

  let body: {
    targetUserId?: string;
    userName?: string;
    fullName?: string;
    image?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "JSON нодуруст" }, { status: 400 });
  }

  const targetUserId = body.targetUserId?.trim();
  if (!targetUserId) {
    return Response.json(
      { error: "targetUserId лозим аст" },
      { status: 400, headers: NO_STORE },
    );
  }

  // Khudro bastan bema'nist.
  if (targetUserId === me.id) {
    return Response.json(
      { error: "Худатонро блок карда наметавонед." },
      { status: 400, headers: NO_STORE },
    );
  }

  const entry: BlockedEntry = {
    userId: targetUserId,
    userName: body.userName?.trim() ?? "",
    fullName: body.fullName?.trim() ?? "",
    image: body.image ?? null,
    blockedAt: Date.now(),
  };

  return Response.json(
    { data: await addBlock(me.id, entry) },
    { headers: NO_STORE },
  );
}

export async function DELETE(request: NextRequest) {
  const me = meOf(request);
  if (me === null) return unauthorized();

  const targetUserId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!targetUserId) {
    return Response.json(
      { error: "userId лозим аст" },
      { status: 400, headers: NO_STORE },
    );
  }

  return Response.json(
    { data: await removeBlock(me.id, targetUserId) },
    { headers: NO_STORE },
  );
}
