// ============================================================
//  app/getInfoUsers/api.ts
//  Profili KORBARI DIGAR. Faqat so-rovho ba backend.
//
//  Swagger: https://instagram-back-qibs.onrender.com/docs/
//    GET    /UserProfile/get-user-profile-by-id?id=      -> GetUserProfileDto
//    GET    /Post/get-posts?UserId=                      -> GetPostDto[]
//    GET    /Reels/get-user-reels?userId=                -> GetReelsDto[]
//    GET    /Profile/get-followers?UserId=               -> ProfileUserDto[]
//    GET    /Profile/get-following?UserId=               -> ProfileUserDto[]
//    POST   /FollowingRelationShip/add-following-relation-ship?followingUserId=
//    DELETE /FollowingRelationShip/delete-following-relation-ship?followingUserId=
//    POST   /Chat/create-chat?receiverUserId=            -> chatId
//
//  Hech ma'lumoti soakhta (demo) in jo NEST.
// ============================================================

export const BACKEND_URL = "https://instagram-back-qibs.onrender.com";
export const API_URL = "/getInfoUsers/proxy";

type ApiResponse<T> = {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
};

// GetUserProfileDto
export type UserProfile = {
  userId: string;
  userName: string;
  fullName: string;
  about: string | null;
  image: string | null;
  postCount: number;
  subscribersCount: number; // folowers
  subscriptionsCount: number; // folowing
  isFollowing: boolean; // man ba u podpiska kardaam?
};

// PostImageDto + GetPostDto (faqat maidonhoi ba mo lozim)
export type Post = {
  postId: number;
  title: string | null;
  images: { id: number; imageName: string | null }[];
  postLikeCount: number;
  commentCount: number;
};

// GetReelsDto (faqat maidonhoi ba mo lozim)
export type Reel = {
  reelsId: number;
  title: string | null;
  videoName: string | null;
  coverName: string | null;
  reelsLikeCount: number;
  reelsViewCount: number;
};

// ProfileUserDto
export type ShortUser = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
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

// 1250 -> "1.2K"
export function shortNumber(value: number | null | undefined): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  if (n < 1000) return String(n);

  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(n)
    .toUpperCase();
}

// ------------------------------------------------------------
//  Yak funksiyai umumi baroi hamai so-rovho (sodda)
// ------------------------------------------------------------
async function call<T>(
  path: string,
  token: string,
  method: "GET" | "POST" | "DELETE" = "GET"
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    const message = body?.errors?.[0] ?? `Khatoi server (${response.status})`;
    throw new Error(message);
  }

  return body?.data as T;
}

// ---------- PROFIL ----------
export function getUserProfile(token: string, userId: string) {
  return call<UserProfile>(
    `/UserProfile/get-user-profile-by-id?id=${userId}`,
    token
  );
}

// ---------- POSTHO ----------
export async function getUserPosts(token: string, userId: string) {
  const list = await call<Post[]>(
    `/Post/get-posts?UserId=${userId}&PageNumber=1&PageSize=30`,
    token
  );
  return Array.isArray(list) ? list : [];
}

// ---------- REELS ----------
export async function getUserReels(token: string, userId: string) {
  const list = await call<Reel[]>(
    `/Reels/get-user-reels?userId=${userId}`,
    token
  );
  return Array.isArray(list) ? list : [];
}

// ---------- PODPISCHIKHO ----------
export async function getFollowers(token: string, userId: string) {
  const list = await call<ShortUser[]>(
    `/Profile/get-followers?UserId=${userId}&PageNumber=1&PageSize=30`,
    token
  );
  return Array.isArray(list) ? list : [];
}

// ---------- U ba KI podpiska kardaast ----------
export async function getFollowing(token: string, userId: string) {
  const list = await call<ShortUser[]>(
    `/Profile/get-following?UserId=${userId}&PageNumber=1&PageSize=30`,
    token
  );
  return Array.isArray(list) ? list : [];
}

// ---------- PODPISKA / OTPISKA ----------
export function follow(token: string, userId: string) {
  return call<string>(
    `/FollowingRelationShip/add-following-relation-ship?followingUserId=${userId}`,
    token,
    "POST"
  );
}

export function unfollow(token: string, userId: string) {
  return call<string>(
    `/FollowingRelationShip/delete-following-relation-ship?followingUserId=${userId}`,
    token,
    "DELETE"
  );
}

// ---------- CHAT ----------
// POST /Chat/create-chat?receiverUserId=...  -> chatId
// Agar suhbat alakay bosad - server hamon chatId-i kuhnaro medihad.
export function createChat(token: string, userId: string) {
  return call<number>(`/Chat/create-chat?receiverUserId=${userId}`, token, "POST");
}
