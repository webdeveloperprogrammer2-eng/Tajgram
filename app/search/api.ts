// ============================================================
//  app/search/api.ts
//  In fayl FAQAT bo backend gap mezanad.
//
//  Swagger: https://instagram-back-qibs.onrender.com/docs/
//    GET /Search/search-users?Search=&PageNumber=&PageSize=
//        -> ProfileUserDto[]
//
//  Hech ma'lumoti soakhta (demo) in jo NEST.
// ============================================================

export const BACKEND_URL = "https://instagram-back-qibs.onrender.com";
export const API_URL = "/search/proxy";

// Server hamesha javobro dar hamin shakl mefiristad
type ApiResponse<T> = {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
};

// ProfileUserDto (az swagger)
export type SearchUser = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  about: string | null;
  isFollowing: boolean; // man ba u podpiska kardaam
  isFollower: boolean; // u ba man podpiska kardaast
  isFriend: boolean; // har du taraf
};

// "images/abc.jpg" -> adresi purra
export function mediaUrl(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name.startsWith("http")) return name;
  return `${BACKEND_URL}/${name.replace(/^\/+/, "")}`;
}

// "Iso Samadov" -> "IS"
export function initials(name: string | null | undefined): string {
  const text = (name ?? "").trim();
  if (text === "") return "?";

  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

// ------------------------------------------------------------
//  GET /Search/search-users
//  Agar khato shavad - matni fahmo bar megardonem.
// ------------------------------------------------------------
export async function searchUsers(
  token: string,
  text: string
): Promise<SearchUser[]> {
  const query = new URLSearchParams({
    Search: text,
    PageNumber: "1",
    PageSize: "20",
  });

  const response = await fetch(`${API_URL}/Search/search-users?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | ApiResponse<SearchUser[]>
    | null;

  if (!response.ok) {
    const message = body?.errors?.[0] ?? `Khatoi server (${response.status})`;
    throw new Error(message);
  }

  return Array.isArray(body?.data) ? body.data : [];
}
