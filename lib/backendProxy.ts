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

/**
 * Yak so-rov, vale bo takror.
 *
 * DU sabab hast, ki fetch ba backend "fetch failed" mepartoyad, dar
 * hole ki backend TAMOMAN solim ast:
 *
 *   1) Render (plani beparbardokht) ba'd az ~15 daqiqai bekori
 *      KHOB meravad. So-rovi YAKUM onro bedor mekunad va metavonad
 *      afted; so-rovi dujum aloqaman kor mekunad.
 *
 *   2) undici (fetch-i Node) aloqahoi keep-alive-ro NIGOH medorad va
 *      az nav istifoda mebarad. Agar server hamon soniya onro pu-shad,
 *      ECONNRESET meshavad. Takror sokete NAV megirad.
 *
 * Faqat khatoi SHABAKA takror meshavad. Agar backend javob dihad -
 * hatto 400 yo 500 - onro AYNAN bar megardonem: takrori sabtinom
 * korbari dukarata nasozad.
 */
const RETRY_DELAYS_MS = [400, 1500, 4000];

async function fetchWithRetry(
  target: string,
  init: RequestInit
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fetch(target, init);
    } catch (error) {
      lastError = error;

      // Body-i takrornashavanda: agar stream bosad, bori dujum
      // firistodan mumkin nest. Mo Uint8Array meguzarem, baroi hamin
      // in jo bekhatar ast.
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) break;

      console.warn(
        `[proxy] ${target} nashud (kushishi ${attempt + 1}), ` +
          `ba'di ${delay}ms az nav mesanjem`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

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
    response = await fetchWithRetry(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  } catch (error) {
    // Sababi ASLI-ro menavisem. Be in, dar log faqat "fetch failed"
    // meistod va fahmidan mumkin nabud, ki chi shud.
    console.error(`[proxy] ${request.method} ${target} nashud:`, error);
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
