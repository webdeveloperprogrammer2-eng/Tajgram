// ============================================================
//  lib/backendProxy.ts
//
//  YAK maghz baroi hamai proxy-hoi mo:
//    /api/backend/*      (lentai asosi, sidebar, ...)
//    /chats/proxy/*
//    /profile/proxy/*
//    /reels/proxy/*
//
//  CHARO IN LOZIM AST?
//  1) CORS: backend "Access-Control-Allow-Origin" namefiristad,
//     baroi hamin so-rov boyad az SERVER-i mo guzarad.
//  2) TOKEN: peshtar faqat /api/backend akkaunti KHIZMATI dosht,
//     vale /chats, /profile va /reels FAQAT token-i localStorage-ro
//     qabul mekardand. Natija: dar lenta korbar "daromada" bud,
//     vale /chats meguft "Avval daroed". Hozir HAMA yak khel:
//     token-i khudi korbar hast -> hamon, nest -> akkaunti khizmati.
// ============================================================
import type { NextRequest } from "next/server";

export const BACKEND = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-back-qibs.onrender.com"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/docs$/i, "");

const SERVICE_USER = process.env.TAJGRAM_USER ?? "dilovar06";
const SERVICE_PASSWORD = process.env.TAJGRAM_PASSWORD ?? "P@ssw0rd!";

let cachedToken: string | null = null;
let inFlight: Promise<string | null> | null = null;

async function login(): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND}/Account/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        userName: SERVICE_USER,
        password: SERVICE_PASSWORD,
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: unknown };
    return typeof json.data === "string" ? json.data : null;
  } catch {
    return null;
  }
}

export async function serviceToken(force = false): Promise<string | null> {
  if (force) cachedToken = null;
  if (cachedToken !== null) return cachedToken;

  inFlight ??= login().then((value) => {
    cachedToken = value;
    inFlight = null;
    return value;
  });

  return inFlight;
}

// Token-i KHUDI korbar az sarlavhai so-rov.
// DIQQAT: "Bearer " KHOLI = token NEST. Peshtar chunin sarlavha
// "token hast" hisob meshud va so-rov bo bearer-i kholi meraft ->
// 401, va ba akkaunti khizmati ham nameguzasht.
export function userBearer(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (raw === null) return null;
  if (!raw.toLowerCase().startsWith("bearer ")) return null;

  const value = raw.slice(7).trim();
  return value === "" ? null : value;
}

export async function forwardToBackend(
  request: NextRequest,
  path: string[]
): Promise<Response> {
  const target = `${BACKEND}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const raw = hasBody ? new Uint8Array(await request.arrayBuffer()) : null;
  const body = raw && raw.byteLength > 0 ? raw : undefined;

  const send = async (bearer: string | null) => {
    const headers = new Headers({ accept: "application/json" });

    // DIQQAT: baroi FormData "content-type"-ro AYNAN hamon tavr
    // meguzaronem - daruni on "boundary" hast.
    const contentType = request.headers.get("content-type");
    if (contentType !== null) headers.set("content-type", contentType);
    if (bearer !== null) headers.set("authorization", `Bearer ${bearer}`);

    return fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  };

  const mine = userBearer(request);

  let response: Response;
  try {
    response = await send(mine ?? (await serviceToken()));

    // Token-i akkaunti khizmati guzashtaast -> yak bor az nav medaroem.
    // Agar token AZ KORBAR bud va 401 dod - hamon tavr bar megardonem,
    // to sahifa khudash ba /Auth/login firistad.
    if (response.status === 401 && mine === null) {
      response = await send(await serviceToken(true));
    }
  } catch {
    return Response.json(
      { data: null, errors: ["Backend dastras nest"], statusCode: 502 },
      { status: 502 }
    );
  }

  const payload = await response.arrayBuffer();

  return new Response(payload, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
