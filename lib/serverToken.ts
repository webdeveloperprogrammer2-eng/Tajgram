/**
 * Служебный вход на бэкенд — один на всё приложение.
 *
 * Логина в интерфейсе нет, поэтому сервер сам получает токен по данным из
 * .env и держит его в памяти процесса. Отсюда его берут и прокси
 * (/api/backend), и /api/session — последняя отдаёт токен браузеру, потому что
 * разделы команды (chats, reels, profile, search) читают его из localStorage.
 */
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

export async function serviceToken(force = false): Promise<string | null> {
  if (force) cachedToken = null;
  if (cachedToken) return cachedToken;

  inFlight ??= login().then((value) => {
    cachedToken = value;
    inFlight = null;
    return value;
  });

  return inFlight;
}
