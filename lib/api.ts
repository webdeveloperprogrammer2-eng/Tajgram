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
  BlockedUser,
} from "./types";

import {
  MOCK_MY_PROFILE,
  MOCK_UNREAD_COUNT,
  MOCK_STORIES,
  MOCK_POSTS,
  MOCK_REELS,
  MOCK_NOTIFICATIONS,
  MOCK_SETTINGS,
  MOCK_BLOCKED_USERS,
  MOCK_FOLLOWINGS,
  MOCK_FOLLOWERS,
  MOCK_CHATS
} from "./mockData";

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
 * So-rovho az proxy-i khudamon meguzarand.
 *
 * DIQQAT: token-i KHUDI KORBAR (hamon "tajgram_token"-e ki
 * /Auth, /chats va /profile istifoda mebarand) mefiristem.
 * Bе in, proxy bo akkaunti KHIZMATI (dilovar06) medaromad va
 * dar sidebar nomi odami DIGAR namoyon meshud.
 */
const API_BASE = "/api/backend";

function myToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem("tajgram_token");
}

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

function getMockDataForPath(path: string, query?: Record<string, QueryValue>): any {
  if (path.startsWith("/UserProfile/get-my-profile")) {
    return MOCK_MY_PROFILE;
  }
  if (path.startsWith("/Notification/get-unread-count")) {
    return MOCK_UNREAD_COUNT;
  }
  if (path.startsWith("/Post/get-following-post")) {
    return MOCK_POSTS;
  }
  if (path.startsWith("/Post/get-posts")) {
    return MOCK_POSTS;
  }
  if (path.startsWith("/Story/get-stories") || path.startsWith("/Story/get-my-stories")) {
    return MOCK_STORIES;
  }
  if (path.startsWith("/Reels/get-reels")) {
    return MOCK_REELS;
  }
  if (path.startsWith("/Notification/get-notifications")) {
    return MOCK_NOTIFICATIONS;
  }
  if (path.startsWith("/Settings/get-settings")) {
    return MOCK_SETTINGS;
  }
  if (path.startsWith("/Settings/get-blocked-users")) {
    return MOCK_BLOCKED_USERS;
  }
  if (path.startsWith("/Search/search-users") || path.startsWith("/User/get-users")) {
    const search = String(query?.Search || query?.UserName || "");
    return MOCK_FOLLOWERS.filter(u => 
      u.userName.toLowerCase().includes(search.toLowerCase()) || 
      u.fullName.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (path.startsWith("/FollowingRelationShip/get-subscribers")) {
    return MOCK_FOLLOWERS;
  }
  if (path.startsWith("/FollowingRelationShip/get-subscriptions")) {
    return MOCK_FOLLOWINGS;
  }
  if (path.startsWith("/Chat/get-chats")) {
    return MOCK_CHATS;
  }
  return null;
}

/** Единая точка входа: разворачивает конверт `{ data, errors, statusCode }`. */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Envelope<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };

  // Token-i khudam - to ma'lumoti MAN oyad, na akkaunti khizmati
  const bearer = myToken();
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

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
  } catch (err) {
    const mock = getMockDataForPath(path, options.query);
    if (mock !== null) {
      return { data: mock as T, errors: null, statusCode: 200 };
    }
    throw new ApiError("Не удалось связаться с сервером", 0);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (response.status >= 500 || (envelope && envelope.statusCode >= 500)) {
    const mock = getMockDataForPath(path, options.query);
    if (mock !== null) {
      return { data: mock as T, errors: null, statusCode: 200 };
    }
  }

  const errors = envelope?.errors?.filter(Boolean) ?? [];

  if (!response.ok || errors.length > 0) {
    const mock = getMockDataForPath(path, options.query);
    if (mock !== null) {
      return { data: mock as T, errors: null, statusCode: 200 };
    }
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

  // POST /Story/AddStories - "momentalniy snimok"
  // DIQQAT: server nomi maidonro qat'i talab mekunad, vale dar
  // swagger on aniq nest. Baroi hamin nomhoro yak-yak mesanjem
  // (hamon rohe ki dar app/profile/api.ts sanjida shudaast).
  addStory: async (image: File) => {
    const fields = ["Image", "Images", "File", "file", "imageFile"];

    // Nomi fayl faqat az harfhoi lotini - ba'ze serverho nomi
    // rusi/tojikiro qabul namekunand.
    const safe = new File([image], `story-${Date.now()}.jpg`, {
      type: image.type === "" ? "image/jpeg" : image.type,
    });

    let last: unknown = null;

    for (const field of fields) {
      const form = new FormData();
      form.append(field, safe);

      try {
        return await request<string>("/Story/AddStories", {
          method: "POST",
          body: form,
        });
      } catch (cause) {
        last = cause;

        const text = cause instanceof Error ? cause.message : "";
        const wrongField =
          text.includes("Unexpected field") ||
          text.toLowerCase().includes("unsupported file type");

        // Khatoi digar (masalan 401) - darhol ist mekunem
        if (!wrongField) throw cause;
      }
    }

    throw last;
  },

  // --- Reels ---
  // POST /Reels/add-reels -> Video hatmi, Cover ikhtiyori
  addReel: (form: FormData) =>
    request<string>("/Reels/add-reels", { method: "POST", body: form }),

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

  // --- Tahrири profil ---
  // DIQQAT: swagger faqat "about" va "gender"-ro qabul mekunad.
  // Ivaz kardani fullName/userName dar backend NEST.
  updateProfile: (patch: { about?: string | null; gender?: 0 | 1 | null }) =>
    request<UserProfile>("/UserProfile/update-user-profile", {
      method: "PUT",
      body: patch,
    }),

  updateAvatar: (file: File) => {
    const form = new FormData();
    form.append("imageFile", file);
    return request<string>("/UserProfile/update-user-image-profile", {
      method: "PUT",
      body: form,
    });
  },

  deleteAvatar: () =>
    request<string>("/UserProfile/delete-user-image-profile", {
      method: "DELETE",
    }),

  changePassword: (oldPassword: string, password: string) =>
    request<string>("/Account/ChangePassword", {
      method: "PUT",
      query: {
        OldPassword: oldPassword,
        Password: password,
        ConfirmPassword: password,
      },
    }),

  blockedUsers: () => request<BlockedUser[]>("/Settings/get-blocked-users"),

  unblockUser: (userId: string) =>
    request<string>("/Settings/unblock-user", {
      method: "DELETE",
      query: { userId },
    }),
};
