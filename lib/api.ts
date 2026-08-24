import type {
  AppNotification,
  Chat,
  Envelope,
  Post,
  PostComment,
  ProfileUser,
  Reel,
  Settings,
  SettingsPatch,
  Story,
  UnreadCount,
  User,
  UserProfile,
} from "./types";

/**
 * Origin бэкенда — нужен только для картинок и видео, которые он отдаёт
 * по относительным путям вида `images/abc.jpg`.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-back-qibs.onrender.com"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/docs$/i, "");

/**
 * Данные запрашиваем через свой прокси: он сам подставляет Bearer-токен,
 * поэтому в интерфейсе нет ни логина, ни регистрации.
 */
const API_BASE = "/api/backend";

export class ApiError extends Error {
  statusCode: number;
  errors: string[];

  constructor(message: string, statusCode: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
};

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

/** Единая точка входа: разворачивает конверт `{ data, errors, statusCode }`. */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Envelope<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Не удалось связаться с сервером", 0);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  const errors = envelope?.errors?.filter(Boolean) ?? [];

  if (!response.ok || errors.length > 0) {
    throw new ApiError(
      errors.join(", ") || `Ошибка запроса (${response.status})`,
      response.status,
      errors,
    );
  }

  return (envelope ??
    ({ data: null as T, errors: null, statusCode: response.status } as Envelope<T>));
}

/** Файлы бэкенд отдаёт по относительному пути вида `images/abc.jpg`. */
export function mediaUrl(name?: string | null): string | null {
  if (!name) return null;
  if (/^(https?:|data:|blob:)/i.test(name)) return name;
  return `${API_URL}/${name.replace(/^\/+/, "")}`;
}

export function isVideo(name?: string | null): boolean {
  return !!name && /\.(mp4|mov|webm|m4v|ogv|avi)$/i.test(name);
}

type Paged = { page?: number; pageSize?: number };

const paging = ({ page = 1, pageSize = 10 }: Paged = {}) => ({
  PageNumber: page,
  PageSize: pageSize,
});

export const api = {
  // --- Профиль ---
  myProfile: () => request<UserProfile>("/UserProfile/get-my-profile"),

  userProfile: (userId: string) =>
    request<UserProfile>("/UserProfile/get-user-profile-by-id", {
      query: { id: userId },
    }),

  favorites: (p?: Paged) =>
    request<Post[]>("/UserProfile/get-post-favorites", { query: paging(p) }),

  // --- Лента ---
  followingPosts: (p?: Paged) =>
    request<Post[]>("/Post/get-following-post", { query: paging(p) }),

  posts: (p?: Paged & { userId?: string }) =>
    request<Post[]>("/Post/get-posts", {
      query: { ...paging(p), UserId: p?.userId },
    }),

  postById: (postId: number) =>
    request<Post>("/Post/get-post-by-id", { query: { id: postId } }),

  addPost: (form: FormData) =>
    request<string>("/Post/add-post", { method: "POST", body: form }),

  likePost: (postId: number) =>
    request<string>("/Post/like-post", { method: "POST", query: { postId } }),

  favoritePost: (postId: number) =>
    request<string>("/Post/add-post-favorite", {
      method: "POST",
      body: { postId },
    }),

  viewPost: (postId: number) =>
    request<string>("/Post/view-post", { method: "POST", query: { postId } }),

  addComment: (postId: number, comment: string) =>
    request<string>("/Post/add-comment", {
      method: "POST",
      body: { postId, comment },
    }),

  postComments: (postId: number, p?: Paged) =>
    request<PostComment[]>("/Comment/get-post-comments", {
      query: { PostId: postId, ...paging(p) },
    }),

  // --- Истории ---
  stories: () => request<Story[]>("/Story/get-stories"),

  myStories: () => request<Story[]>("/Story/get-my-stories"),

  // --- Люди ---
  searchUsers: (search?: string, p?: Paged) =>
    request<ProfileUser[]>("/Search/search-users", {
      query: { Search: search, ...paging(p) },
    }),

  users: (p?: Paged & { userName?: string }) =>
    request<User[]>("/User/get-users", {
      query: { ...paging(p), UserName: p?.userName },
    }),

  follow: (followingUserId: string) =>
    request<string>("/FollowingRelationShip/add-following-relation-ship", {
      method: "POST",
      query: { followingUserId },
    }),

  unfollow: (followingUserId: string) =>
    request<string>("/FollowingRelationShip/delete-following-relation-ship", {
      method: "DELETE",
      query: { followingUserId },
    }),

  // --- Reels ---
  reels: (p?: Paged) => request<Reel[]>("/Reels/get-reels", { query: paging(p) }),

  likeReels: (reelsId: number) =>
    request<string>("/Reels/like-reels", { method: "POST", query: { reelsId } }),

  // --- Чаты и уведомления ---
  chats: () => request<Chat[]>("/Chat/get-chats"),

  notifications: (p?: Paged & { type?: string; onlyUnread?: boolean }) =>
    request<AppNotification[]>("/Notification/get-notifications", {
      query: { ...paging(p), Type: p?.type, OnlyUnread: p?.onlyUnread },
    }),

  unreadCount: () => request<UnreadCount>("/Notification/get-unread-count"),

  readAllNotifications: () =>
    request<string>("/Notification/read-all-notifications", { method: "POST" }),

  // --- Настройки ---
  settings: () => request<Settings>("/Settings/get-settings"),

  updateSettings: (patch: SettingsPatch) =>
    request<Settings>("/Settings/update-settings", { method: "PUT", body: patch }),
};
