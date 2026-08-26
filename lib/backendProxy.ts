// ============================================================
//  lib/backendProxy.ts
//
//  YAK maghz baroi hamai proxy-hoi mo:
//    /api/backend/*      (lentai asosi, sidebar, ...)
//    /chats/proxy/*
//    /profile/proxy/*
//    /reels/proxy/*
//    /search/proxy/*
//    /getInfoUsers/proxy/*
//
//  CHARO IN LOZIM AST?
//  Backend sarlavhai "Access-Control-Allow-Origin" namefiristad,
//  baroi hamin so-rov az browser ROST rafta nametavonad (CORS).
//  Server-i mo onro meguzaronad.
//
//  ============================================================
//  DIQQAT - IN JO YAK KHATOI KALON BUD:
//
//  Peshtar, agar korbar token NADOSHT, proxy KHUDASH bo
//  akkaunti KHIZMATI (dilovar06) medaromad va ma'lumoti
//  HAMON odamro bar megardond. Natija:
//    - har mehmon be login "daromada" menamud;
//    - dar sidebar nomi odami DIGAR (dilovar06) meistod;
//    - like, komment va post az nomi U mearaftand;
//    - "baromadan" hech chizro ivaz namekard - sahifa
//      az nav hamon akkauntro megirift.
//
//  Instagram chunin namekunad: token nest -> 401 -> login.
//  Hozir mo ham AYNAN hamin tavr mekunem. Akkaunti khizmati
//  TAMOMAN bardoshta shud.
//  ============================================================
import type { NextRequest } from "next/server";

export const BACKEND = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-back-qibs.onrender.com"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/docs$/i, "");

/** Javobi yakkhela dar hamon shakle ki backend medihad. */
function envelope(message: string, status: number) {
  return Response.json(
    { data: null, errors: [message], statusCode: status },
    { status, headers: { "cache-control": "no-store" } }
  );
}

// Token-i KHUDI korbar az sarlavhai so-rov.
// DIQQAT: "Bearer " KHOLI = token NEST.
export function userBearer(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (raw === null) return null;
  if (!raw.toLowerCase().startsWith("bearer ")) return null;

  const value = raw.slice(7).trim();
  return value === "" ? null : value;
}

export type ForwardOptions = {
  /**
   * So-rov BE token ham ravad?
   *
   * Faqat baroi /Auth/proxy lozim ast: voridshavi va sabtinom
   * (POST /Account/login, /Account/register) tabian token
   * NADORAND - odam hanuz nadaromadaast.
   *
   * Boqi hamai bakhshho token TALAB mekunand.
   */
  allowAnonymous?: boolean;
};

export async function forwardToBackend(
  request: NextRequest,
  path: string[],
  options: ForwardOptions = {}
): Promise<Response> {
  const bearer = userBearer(request);

  // Token nest -> ba backend UMUMAN so-rov namefiristem.
  // Sahifa in 401-ro megirad va ba /Auth/login mefiristad.
  if (bearer === null && options.allowAnonymous !== true) {
    return envelope("Avval ba account daroed.", 401);
  }

  const target = `${BACKEND}/${path.join("/")}${request.nextUrl.search}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const raw = hasBody ? new Uint8Array(await request.arrayBuffer()) : null;
  const body = raw !== null && raw.byteLength > 0 ? raw : undefined;

  const headers = new Headers({ accept: "application/json" });
  if (bearer !== null) headers.set("authorization", `Bearer ${bearer}`);

  // DIQQAT: baroi FormData "content-type"-ro AYNAN hamon tavr
  // meguzaronem - daruni on "boundary" hast.
  const contentType = request.headers.get("content-type");
  if (contentType !== null) headers.set("content-type", contentType);

  let response: Response;
  try {
    response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return envelope("Backend dastras nest. Ba'dtar sanjed.", 502);
  }

  const payload = await response.arrayBuffer();

  return new Response(payload, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
