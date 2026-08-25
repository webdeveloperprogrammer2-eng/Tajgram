import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

/**
 * Прокси к Instagram API.
 *
 * Вся логика — в lib/backendProxy.ts, тот же модуль используют
 * /chats/proxy, /profile/proxy и /reels/proxy. Если браузер прислал
 * токен пользователя — идёт он, иначе сервер логинится сервисным
 * аккаунтом из .env и держит токен в памяти процесса.
 */
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
