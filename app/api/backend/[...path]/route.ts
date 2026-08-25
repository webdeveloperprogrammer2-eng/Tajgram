import type { NextRequest } from "next/server";
import { BACKEND, serviceToken } from "@/lib/serverToken";

/**
 * Прокси к Instagram API.
 *
 * Бэкенд требует Bearer-токен на всех эндпоинтах кроме /Account/*, но входа
 * в интерфейсе нет: сервер сам логинится сервисным аккаунтом из .env, держит
 * токен в памяти процесса и подставляет его в каждый запрос. Логин и пароль
 * остаются на сервере; сам токен браузер получает отдельно (/api/session),
 * потому что разделы команды ходят на бэкенд напрямую.
 */
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

  let response: Response;
  try {
    response = await send(await serviceToken());
    // Токен мог истечь, пока процесс жил — логинимся заново один раз.
    if (response.status === 401) response = await send(await serviceToken(true));
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
