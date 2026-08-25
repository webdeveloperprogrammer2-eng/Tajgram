import type { NextRequest } from "next/server";

/**
 * Прокси к Instagram API.
 *
 * Бэкенд требует Bearer-токен на всех эндпоинтах кроме /Account/*, но входа
 * в интерфейсе нет: сервер сам логинится сервисным аккаунтом из .env, держит
 * токен в памяти процесса и подставляет его в каждый запрос. В браузер
 * ни логин, ни пароль, ни токен не попадают.
 */
const BACKEND = (
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
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ userName: SERVICE_USER, password: SERVICE_PASSWORD }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: unknown };
    return typeof json.data === "string" ? json.data : null;
  } catch {
    return null;
  }
}

async function token(force = false): Promise<string | null> {
  if (force) cachedToken = null;
  if (cachedToken) return cachedToken;

  inFlight ??= login().then((value) => {
    cachedToken = value;
    inFlight = null;
    return value;
  });

  return inFlight;
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = `${BACKEND}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const raw = hasBody ? new Uint8Array(await request.arrayBuffer()) : null;
  const body = raw && raw.byteLength > 0 ? raw : undefined;

  const send = async (bearer: string | null) => {
    const headers = new Headers({ accept: "application/json" });
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    if (bearer) headers.set("authorization", `Bearer ${bearer}`);

    return fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  };

  // Agar browser token-i KHUDI korbarro firistad - hamonro meguzronem.
  // Faqat agar token naboshad, ba akkaunti khizmati mefaroem.
  const fromUser = request.headers.get("authorization");
  const userBearer =
    fromUser && fromUser.toLowerCase().startsWith("bearer ")
      ? fromUser.slice(7).trim()
      : null;

  let response: Response;
  try {
    response = await send(userBearer ?? (await token()));

    // Token guzashtaast:
    //   - agar az korbar bud -> 401-ro hamon tavr bar megardonem
    //     (bigzor sahifa ba /Auth/login firistad)
    //   - agar akkaunti khizmati bud -> yak bor az nav medaroem
    if (response.status === 401 && userBearer === null) {
      response = await send(await token(true));
    }
  } catch {
    return Response.json(
      { data: null, errors: ["Бэкенд недоступен"], statusCode: 502 },
      { status: 502 },
    );
  }

  const payload = await response.text();
  return new Response(payload, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
