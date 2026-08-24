// ============================================================
//  app/reels/api.ts
//  In fayl FAQAT bo backend gap mezanad. Hech dizayn in jo nest.
//
//  Swagger: https://instagram-back-qibs.onrender.com/docs/
//  Endpoint-hoi REELS (aynan az swagger):
//    GET  /Reels/get-reels?PageNumber=&PageSize=      -> GetReelsDto[]
//    GET  /Reels/get-following-reels?PageNumber=&...  -> GetReelsDto[]
//    GET  /Reels/get-reels-favorites?PageNumber=&...  -> GetReelsDto[]
//    GET  /Reels/get-reels-by-id?id=                  -> GetReelsDto
//    POST /Reels/like-reels?reelsId=                  -> "..."
//    POST /Reels/view-reels?reelsId=                  -> "..."
//    POST /Reels/add-reels-favorite  (json: { reelsId })
//    GET  /Comment/get-reels-comments?ReelsId=&...    -> GetCommentDto[]
//    POST /Comment/add-comment       (json: { comment, reelsId })
//
//  QOIDA: hech ma'lumoti soakhta (demo/test) in jo NEST.
//  Har chize ki dar sahifa namoyon meshavad - az server meoyad.
// ============================================================

// Manzili VOQEI-i backend - faqat baroi VIDEO va SURAT
export const BACKEND_URL = "https://instagram-back-qibs.onrender.com";

// Hamai fetch-ho az proxy-i khudi papkai reels meguzarand (CORS)
export const API_URL = "/reels/proxy";

// Server HAMESHA javobro dar hamin shakl mefiristad
export type ApiResponse<T> = {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
};

// ------------------------------------------------------------
//  1) TYPE-HO (az swagger: components.schemas)
// ------------------------------------------------------------

// GetReelsDto
export type Reel = {
  reelsId: number;
  title: string | null;
  description: string | null;
  videoName: string | null; // misol: "images/abc.mp4"
  coverName: string | null;
  datePublished: string;
  userId: string;
  userName: string;
  userImage: string | null;
  reelsLikeCount: number;
  reelsViewCount: number;
  commentCount: number;
  reelsFavoriteCount: number;
  repostCount: number;
  reelsLike: boolean; // man like kardaam?
  reelsFavorite: boolean;
  reelsView: boolean;
};

// GetCommentDto
export type Comment = {
  commentId: number;
  comment: string;
  postId: number | null;
  reelsId: number | null;
  parentCommentId: number | null;
  userId: string;
  userName: string;
  userImage: string | null;
  dateCommented: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  isMine: boolean;
};

// GetUserProfileDto - faqat maidonhoi ba mo lozim
export type MyProfile = {
  userId: string;
  userName: string;
  image: string | null;
};

// ------------------------------------------------------------
//  2) ADRESI FAYLHO ("images/abc.mp4" -> adresi purra)
//     <video src> va <img src> ba CORS ehtiyoj nadorand.
// ------------------------------------------------------------
export function mediaUrl(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name.startsWith("http")) return name;
  return `${BACKEND_URL}/${name.replace(/^\/+/, "")}`;
}

// ------------------------------------------------------------
//  3) KHATOHO
// ------------------------------------------------------------
export class ApiError extends Error {
  messages: string[];
  status: number;

  constructor(messages: string[], status: number) {
    super(messages[0] ?? "Server error");
    this.name = "ApiError";
    this.messages = messages;
    this.status = status;
  }
}

export function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.messages.join(" ");
  return fallback;
}

function toApiError(err: unknown, path: string): ApiError {
  if (err instanceof ApiError) return err;

  const reason = err instanceof Error ? err.message : String(err);

  const offline =
    typeof navigator !== "undefined" && navigator.onLine === false;

  if (offline) {
    return new ApiError(["Internet nest. Ulanishro sanjed."], 0);
  }

  console.error(`[reels] so-rov narasid: ${path}`, err);

  return new ApiError(
    [
      `So-rov ba server narasid: ${path}`,
      `Sabab: ${reason}`,
      "Sahifaro nav kuned (Ctrl+Shift+R).",
    ],
    0
  );
}

function describeStatus(status: number, path: string): string {
  if (status === 401) return "Token guzashtaast. Az nav daroed.";
  if (status === 403) return "Ijozat nest.";
  if (status === 404) return `Chunin ma'lumot yoft nashud: ${path}`;
  if (status === 502 || status === 503)
    return "Backend hozir khob ast (Render). 30-60 soniya sabr kuned.";
  if (status >= 500) return `Khatoi daruni server (HTTP ${status}).`;

  return `HTTP ${status} - ${path}`;
}

// ------------------------------------------------------------
//  4) YAK darvozai umumi baroi HAMAI so-rovho
// ------------------------------------------------------------
type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token: string;
  query?: Record<string, string | number | undefined>;
  json?: unknown;
};

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", token, query, json } = options;

  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    }
  }
  const tail = search.toString() === "" ? "" : `?${search.toString()}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (json !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${tail}`, {
      method,
      headers,
      body: json === undefined ? undefined : JSON.stringify(json),
      cache: "no-store",
    });
  } catch (err) {
    throw toApiError(err, path);
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const raw = body?.errors ?? [];
    const list = raw.flatMap((line) => line.split("; ")).filter(Boolean);

    throw new ApiError(
      list.length > 0 ? list : [describeStatus(response.status, path)],
      body?.statusCode ?? response.status
    );
  }

  return body?.data as T;
}

// ============================================================
//  PROFIL (faqat baroi avatari khudam dar maidoni komment)
// ============================================================
export function getMyProfile(token: string) {
  return request<MyProfile>("/UserProfile/get-my-profile", { token });
}

// ============================================================
//  REELS
// ============================================================

// GET /Reels/get-reels - HAMAI reels-ho (sahifa ba sahifa)
export function getReels(token: string, page: number, size: number) {
  return request<Reel[]>("/Reels/get-reels", {
    token,
    query: { PageNumber: page, PageSize: size },
  });
}

// GET /Reels/get-following-reels - faqat az onhoe ki man podpiska kardaam
export function getFollowingReels(token: string, page: number, size: number) {
  return request<Reel[]>("/Reels/get-following-reels", {
    token,
    query: { PageNumber: page, PageSize: size },
  });
}

// GET /Reels/get-reels-favorites - saqlshudaho
export function getFavoriteReels(token: string, page: number, size: number) {
  return request<Reel[]>("/Reels/get-reels-favorites", {
    token,
    query: { PageNumber: page, PageSize: size },
  });
}

// GET /Reels/get-reels-by-id?id=
export function getReelById(token: string, id: number) {
  return request<Reel>("/Reels/get-reels-by-id", { token, query: { id } });
}

// POST /Reels/like-reels?reelsId=  (yak tugma: like <-> unlike)
export function likeReel(token: string, reelsId: number) {
  return request<string>("/Reels/like-reels", {
    method: "POST",
    token,
    query: { reelsId },
  });
}

// POST /Reels/view-reels?reelsId=  (prosmotr - yak bor baroi har video)
export function viewReel(token: string, reelsId: number) {
  return request<string>("/Reels/view-reels", {
    method: "POST",
    token,
    query: { reelsId },
  });
}

// POST /Reels/add-reels-favorite  { reelsId }
export function favoriteReel(token: string, reelsId: number) {
  return request<string>("/Reels/add-reels-favorite", {
    method: "POST",
    token,
    json: { reelsId },
  });
}

// ============================================================
//  KOMMENTHOI REELS
// ============================================================

// GET /Comment/get-reels-comments?ReelsId=
export function getReelComments(token: string, reelsId: number) {
  return request<Comment[]>("/Comment/get-reels-comments", {
    token,
    query: { ReelsId: reelsId, PageNumber: 1, PageSize: 50 },
  });
}

// POST /Comment/add-comment  { comment, reelsId }
export function addReelComment(
  token: string,
  reelsId: number,
  comment: string
) {
  return request<Comment>("/Comment/add-comment", {
    method: "POST",
    token,
    json: { comment, reelsId },
  });
}

// POST /Comment/like-comment?commentId=
export function likeComment(token: string, commentId: number) {
  return request<string>("/Comment/like-comment", {
    method: "POST",
    token,
    query: { commentId },
  });
}
