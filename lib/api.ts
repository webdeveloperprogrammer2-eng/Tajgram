import type {
  Actual,
  ActualDetails,
  AppNotification,
  Chat,
  ChatMessage,
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
import { getToken, onUnauthorized } from "./auth";
import { tr } from "@/components/appLang";

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
 * So-rovho az proxy-i khudamon meguzarand (CORS).
 *
 * Token FAQAT az khudi korbar meoyad (lib/auth.ts).
 * Akkaunti khizmati digar NEST - agar token naboshad,
 * proxy 401 medihad va mo ba /Auth/login mefiristem.
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

  // Token-i khudam - to ma'lumoti MAN oyad, na kasi digar
  const bearer = getToken();
  if (bearer !== null) headers.Authorization = `Bearer ${bearer}`;

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

  // Token guzasht yo qalb ast -> ba sahifai voridshavi.
  // Peshtar in jo hech chiz nabud va sahifa "kholi" memond.
  if (response.status === 401) {
    onUnauthorized();
    throw new ApiError(tr().loginFirst, 401, errors);
  }

  if (!response.ok || errors.length > 0) {
    throw new ApiError(
      errors.join(", ") || `${tr().errRequest} (${response.status})`,
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

/**
 * Хатои махсус: аккаунт дар backend админ нест ('/Admin/*' guard 403).
 * Панел инро гирифта ба админ паём нишон медиҳад, на «хатои умумӣ».
 */
export class NotAdminError extends ApiError {
  constructor(message: string) {
    super(message, 403);
    this.name = "NotAdminError";
  }
}

/**
 * Якчанд номи эҳтимолии роути '/Admin/*'-ро месанҷад ва аввалинеро,
 * ки ҷавоб медиҳад, бармегардонад. Номи кордиҳандаро кеш мекунад.
 */
const adminRouteCache = new Map<string, string>();

async function probeAdmin<T>(
  candidates: string[],
  query: Record<string, QueryValue>,
): Promise<T> {
  const cacheKey = candidates.join("|");
  const known = adminRouteCache.get(cacheKey);
  const order = known ? [known, ...candidates.filter((c) => c !== known)] : candidates;

  let lastNotAdmin: NotAdminError | null = null;

  for (const path of order) {
    try {
      const env = await request<T>(path, { query });
      adminRouteCache.set(cacheKey, path);
      return env.data;
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;

      // Guard-и /Admin: аккаунт админ нест -> паёми равшан.
      if (
        err.statusCode === 403 &&
        /administrator access is required/i.test(err.message)
      ) {
        lastNotAdmin = new NotAdminError(
          "Ин аккаунт дар backend ҳуқуқи администраторӣ надорад.",
        );
        continue;
      }

      // 404 = ин номи роут нест -> номи навбатиро месанҷем.
      if (err.statusCode === 404) continue;

      // Хатои дигар (масалан 401) -> дарҳол мепартоем.
      throw err;
    }
  }

  if (lastNotAdmin) throw lastNotAdmin;
  throw new ApiError("Роути админи чат ёфт нашуд.", 404);
}

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

  /** POST /Story/add-story-view -> "man in storyro didam" */
  viewStory: (storyId: number) =>
    request<string>("/Story/add-story-view", {
      method: "POST",
      query: { StoryId: storyId },
    }),

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

  // --- Actualniy (Highlights) ---
  // Backend inro 26.08.2026 ilova kard.
  myActuals: () => request<Actual[]>("/Actual/get-my-actuals"),

  userActuals: (userId: string) =>
    request<Actual[]>("/Actual/get-actuals", {
      query: { UserId: userId, ...paging({ pageSize: 50 }) },
    }),

  /** Yak actual hamrohi HAMAI storyhoyash. */
  actualById: (id: number) =>
    request<ActualDetails>("/Actual/get-actual-by-id", { query: { id } }),

  // --- Люди ---
  searchUsers: (search?: string, p?: Paged) =>
    request<ProfileUser[]>("/Search/search-users", {
      query: { Search: search, ...paging(p) },
    }),

  users: (p?: Paged & { userName?: string; email?: string }) =>
    request<User[]>("/User/get-users", {
      query: { ...paging(p), UserName: p?.userName, Email: p?.email },
    }),

  // --- Admin (faqat baroi paneli admin) ---
  // Backend nақши "admin"-i alohida nadorad: hamin so-rovho barои
  // HAR korbari daromada kor mekunand, vale mo onhoro faqat dar
  // /admin (ki faqat korbari "admin" mebinad) istifoda mebarem.

  /** Reelhoi yak korbari mushakhas. */
  userReels: (userId: string) =>
    request<Reel[]>("/Reels/get-user-reels", { query: { userId } }),

  /** DELETE /User/delete-user -> korbarro purra pok mekunad. */
  deleteUser: (userId: string) =>
    request<string>("/User/delete-user", {
      method: "DELETE",
      query: { userId },
    }),

  /**
   * Chatҳои korбари muayyan (ФАҚАТ барои админ).
   * Backend гурӯҳи /Admin/*-ро дорад, вале бо guard пинҳон аст,
   * барои ҳамин номи дақиқи роут маълум нест -> номҳои эҳтимолиро
   * як-як месанҷем. 404 = номи нодуруст (роути дигар); 403 =
   * аккаунт админ нест (паём ба корбар нишон дода мешавад).
   */
  adminUserChats: (userId: string) =>
    probeAdmin<Chat[]>(
      [
        "/Admin/get-user-chats",
        "/Admin/get-chats",
        "/Admin/get-user-chat",
        "/Admin/user-chats",
      ],
      { UserId: userId, userId },
    ),

  /** Паёмҳои як чат (барои админ). */
  adminChatMessages: (chatId: number) =>
    probeAdmin<ChatMessage[]>(
      [
        "/Admin/get-chat-messages",
        "/Admin/get-chat-by-id",
        "/Admin/get-messages",
        "/Admin/get-chat",
      ],
      { chatId, ChatId: chatId },
    ),

  /** GET /FollowingRelationShip/get-subscribers -> KI ba U obuna ast */
  followers: (userId: string) =>
    request<ProfileUser[]>("/FollowingRelationShip/get-subscribers", {
      query: { UserId: userId },
    }),

  /** GET /FollowingRelationShip/get-subscriptions -> U ba KI obuna ast */
  followings: (userId: string) =>
    request<ProfileUser[]>("/FollowingRelationShip/get-subscriptions", {
      query: { UserId: userId },
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
