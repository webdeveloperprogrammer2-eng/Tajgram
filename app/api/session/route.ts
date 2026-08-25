import { serviceToken } from "@/lib/serverToken";

/**
 * Отдаёт браузеру служебный токен.
 *
 * Разделы команды (chats, reels, profile, search, getInfoUsers) ходят на
 * бэкенд напрямую и берут токен из localStorage["tajgram_token"]. Логина у нас
 * нет, поэтому без этого ключа их страницы показывают пустой чёрный экран.
 */
export async function GET() {
  const token = await serviceToken();

  if (!token) {
    return Response.json(
      { data: null, errors: ["Служебный вход не удался"], statusCode: 502 },
      { status: 502 },
    );
  }

  return Response.json(
    { data: token, errors: null, statusCode: 200 },
    { headers: { "cache-control": "no-store" } },
  );
}
