// ============================================================
//  app/profile/api.ts
//  In fayl FAQAT bo backend gap mezanad. Hech dizayn in jo nest.
//
//  Swagger: https://instagram-back-qibs.onrender.com/docs/
//  Hamai type-ho AYNAN az schema-hoi swagger girifta shudand.
//
//  QOIDA: hech ma'lumoti "az dili khud" (demo, test, surat, video)
//  in jo NEST. Har chize ki dar sahifa namoyon meshavad -
//  az server meoyad.
// ============================================================

// 1) Manzili VOQEI-i backend.
//    Faqat baroi SURAT va VIDEO istifoda meshavad
//    (<img src=...> va <video src=...> ba CORS ehtiyoj nadorand).
export const BACKEND_URL = "https://instagram-back-qibs.onrender.com";

// 2) Hamai so-rovhoi fetch az PROXY-i khudamon meguzarand.
//    Sabab: backend sarlavhai Access-Control-Allow-Origin namefiristad,
//    baroi hamin browser so-rovi mustaqimro band mekunad (CORS).
//    Proxy dar app/profile/proxy/[...path]/route.ts ast.
export const API_URL = "/profile/proxy";

// Server HAMESHA javobro dar hamin shakl mefiristad
export type ApiResponse<T> = {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
};

// ------------------------------------------------------------
//  1) TYPE-HO (az swagger: components.schemas)
// ------------------------------------------------------------

// GetUserProfileDto
export type UserProfile = {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  about: string | null;
  gender: number | null; // 0 | 1
  image: string | null; // misol: "images/abc.jpg"
  postCount: number;
  subscribersCount: number; // folowers
  subscriptionsCount: number; // folowing
  isFollowing: boolean;
  posts: Post[];
};

// PostImageDto
export type PostImage = {
  id: number;
  imageName: string | null;
};

// PostCommentDto - 3 tai okhirin, daruni khudi post
export type PostComment = {
  commentId: number;
  comment: string;
  userId: string;
  userName: string;
  userImage: string | null;
  dateCommented: string;
};

// GetPostDto
export type Post = {
  postId: number;
  title: string | null;
  content: string | null;
  datePublished: string;
  userId: string;
  userName: string;
  userImage: string | null;
  images: PostImage[];
  postLikeCount: number;
  postViewCount: number;
  commentCount: number;
  postFavoriteCount: number;
  postLike: boolean; // man like kardaam?
  postFavorite: boolean;
  postView: boolean;
  comments: PostComment[];
};

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
  reelsViewCount: number; // PROSMOTR
  commentCount: number;
  reelsFavoriteCount: number;
  repostCount: number;
  reelsLike: boolean;
  reelsFavorite: boolean;
  reelsView: boolean;
};

// ViewerDto - daruni story
export type StoryViewer = {
  userName: string | null;
  name: string | null;
  viewCount: number | null;
  viewLike: number | null;
};

// GetStoryDto
export type Story = {
  id: number;
  fileName: string | null;
  postId: number | null;
  createAt: string;
  userId: string | null;
  userAvatar: string | null;
  viewerDto: StoryViewer | null;
};

// FollowUserDto
export type FollowUser = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  isFollowing: boolean;
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

// ------------------------------------------------------------
//  2) ADRESI FAYLHO
//  Server nomi faylro chunin medihad: "images/abc.jpg"
//  Adresi purra:  https://instagram-back-qibs.onrender.com/images/abc.jpg
//
//  In jo BACKEND_URL ast, na proxy - chunki <img> va <video>
//  ba CORS ehtiyoj nadorand va rost az backend megirand.
// ------------------------------------------------------------
export function mediaUrl(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name.startsWith("http")) return name; // server adresi purra dod
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

// ------------------------------------------------------------
//  Matni khatoro baroi NAMOISH tayyor mekunad.
//  ApiError metavonad CHAND satr dosad - hamai onhoro yakjo mekunem,
//  ki korbar sababi VOQEI-ro binad, na faqat satri avval.
// ------------------------------------------------------------
export function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.messages.join(" ");
  return fallback;
}

// ------------------------------------------------------------
//  fetch() FAQAT dar yak holat khato mepartoyad:
//  agar so-rov ba server UMUMAN NARASAD.
//  (agar server javobi 400/500 dihad - fetch khato namepartoyad!)
//
//  Sabab metavonad 3 chiz bosad:
//    1. internet nest
//    2. server-i mo (next dev) az nav bor shuda istodaast
//    3. sahifa bo kodi KUHNA kushoda ast (masalan pesh az proxy)
//
//  Baroi hamin mo sababi VOQEI-ro menavisem, na faqat "aybi server".
// ------------------------------------------------------------
function toApiError(err: unknown, path: string): ApiError {
  if (err instanceof ApiError) return err;

  const reason = err instanceof Error ? err.message : String(err);

  // Browser khudash megu-yad ki internet hast yo ne
  const offline =
    typeof navigator !== "undefined" && navigator.onLine === false;

  if (offline) {
    return new ApiError(["Internet nest. Ulanishro sanjed."], 0);
  }

  // Dar konsol tafsiloti purra - baroi mo (dasturson)
  console.error(`[profile] so-rov narasid: ${path}`, err);

  return new ApiError(
    [
      `So-rov ba server narasid: ${path}`,
      `Sabab: ${reason}`,
      "Sahifaro nav kuned (Ctrl+Shift+R).",
    ],
    0
  );
}

// ------------------------------------------------------------
//  Agar server matni khato nadihad - mo khudamon
//  ba'di raqami HTTP matni fahmo menavisem.
// ------------------------------------------------------------
function describeStatus(status: number, path: string): string {
  if (status === 401) return "Token guzashtaast. Az nav daroed.";
  if (status === 403) return "Ijozat nest.";
  if (status === 404) return `Chunin ma'lumot yoft nashud: ${path}`;
  if (status === 413) return "Fayl khele kalon ast. Khurdtarashro intikhob kuned.";
  if (status === 502 || status === 503)
    return "Backend hozir khob ast (Render). 30-60 soniya sabr kuned.";
  if (status >= 500) return `Khatoi daruni server (HTTP ${status}).`;

  return `HTTP ${status} - ${path}`;
}

// ------------------------------------------------------------
//  4) YAK darvozai umumi baroi HAMAI so-rovho.
//  Hamesha token meguzorad va javobro yakkhela mekhonad.
// ------------------------------------------------------------
type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token: string;
  query?: Record<string, string | number | undefined>;
  json?: unknown;
  form?: FormData;
};

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", token, query, json, form } = options;

  // query -> "?a=1&b=2"
  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    }
  }
  const tail = search.toString() === "" ? "" : `?${search.toString()}`;

  // Sarlavhaho. DIQQAT: baroi FormData "Content-Type"-ro MO nameguzorem -
  // browser khudash onro bo "boundary"-i durust meguzorad.
  // Agar token-i khudi korbar naboshad - sarlavharo UMUMAN
  // NAMEGUZOREM. On vaqt proxy khudash bo akkaunti khizmati
  // medarod. (Peshtar "Bearer " KHOLI merafт -> 401 -> "Avval daroed".)
  const headers: Record<string, string> = {};
  if (token !== "") headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}${tail}`, {
      method,
      headers,
      body: form ?? (json === undefined ? undefined : JSON.stringify(json)),
      cache: "no-store",
    });
  } catch (err) {
    throw toApiError(err, path);
  }

  // Ba'ze vaqt javob JSON NEST (masalan sahifai khatoi 502 az Render).
  let body: ApiResponse<T> | null = null;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    // Server khatohoro bo "; " yakjo mekunad -> mo onhoro judo mekunem.
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
//  PROFIL
// ============================================================

// GET /UserProfile/get-my-profile
export function getMyProfile(token: string) {
  return request<UserProfile>("/UserProfile/get-my-profile", { token });
}

// PUT /UserProfile/update-user-profile  (faqat about + gender)
export function updateMyProfile(
  token: string,
  body: { about: string | null; gender: number | null }
) {
  return request<UserProfile>("/UserProfile/update-user-profile", {
    method: "PUT",
    token,
    json: body,
  });
}

// PUT /UserProfile/update-user-image-profile  (avatar-i nav)
export function updateMyAvatar(token: string, file: File) {
  const form = new FormData();
  form.append("imageFile", file);

  return request<string>("/UserProfile/update-user-image-profile", {
    method: "PUT",
    token,
    form,
  });
}

// DELETE /UserProfile/delete-user-image-profile
export function deleteMyAvatar(token: string) {
  return request<string>("/UserProfile/delete-user-image-profile", {
    method: "DELETE",
    token,
  });
}

// ============================================================
//  POSTHO
// ============================================================

// GET /Post/get-my-posts
export function getMyPosts(token: string) {
  return request<Post[]>("/Post/get-my-posts", { token });
}

// GET /Post/get-post-by-id
export function getPostById(token: string, id: number) {
  return request<Post>("/Post/get-post-by-id", { token, query: { id } });
}

// POST /Post/add-post  -> kam az kam YAK surat lozim ast
export function addPost(
  token: string,
  body: { title: string; content: string; images: File[] }
) {
  const form = new FormData();
  form.append("Title", body.title);
  form.append("Content", body.content);
  for (const file of body.images) form.append("Images", file);

  return request<Post>("/Post/add-post", { method: "POST", token, form });
}

// DELETE /Post/delete-post
export function deletePost(token: string, id: number) {
  return request<string>("/Post/delete-post", {
    method: "DELETE",
    token,
    query: { id },
  });
}

// POST /Post/like-post  -> like meguzorad yo pas megirad
export function likePost(token: string, postId: number) {
  return request<string>("/Post/like-post", {
    method: "POST",
    token,
    query: { postId },
  });
}

// POST /Post/view-post  -> PROSMOTR hisob meshavad
export function viewPost(token: string, postId: number) {
  return request<string>("/Post/view-post", {
    method: "POST",
    token,
    query: { postId },
  });
}

// ============================================================
//  REELS
// ============================================================

// GET /Reels/get-my-reels
export function getMyReels(token: string) {
  return request<Reel[]>("/Reels/get-my-reels", { token });
}

// POST /Reels/add-reels  -> Video hatmi, Cover ikhtiyori
export function addReel(
  token: string,
  body: { title: string; description: string; video: File; cover?: File | null }
) {
  const form = new FormData();
  form.append("Title", body.title);
  form.append("Description", body.description);
  form.append("Video", body.video);
  if (body.cover) form.append("Cover", body.cover);

  return request<Reel>("/Reels/add-reels", { method: "POST", token, form });
}

// DELETE /Reels/delete-reels
export function deleteReel(token: string, id: number) {
  return request<string>("/Reels/delete-reels", {
    method: "DELETE",
    token,
    query: { id },
  });
}

// POST /Reels/like-reels
export function likeReel(token: string, reelsId: number) {
  return request<string>("/Reels/like-reels", {
    method: "POST",
    token,
    query: { reelsId },
  });
}

// POST /Reels/view-reels  -> PROSMOTR (yak bor az har korbar)
export function viewReel(token: string, reelsId: number) {
  return request<string>("/Reels/view-reels", {
    method: "POST",
    token,
    query: { reelsId },
  });
}

// ============================================================
//  STORY
// ============================================================

// GET /Story/get-my-stories
export function getMyStories(token: string) {
  return request<Story[]>("/Story/get-my-stories", { token });
}

// POST /Story/AddStories  -> surat, yo havola ba post, yo har du
export async function addStory(token: string, image: File) {
  // MUAMMO: server javob medod "Unexpected field (Image: unsupported file type)".
  // Sabab: nomi maidon (field) yo namudi fayl ba u nameforad.
  // Baroi hamin nomhoi mumkinro yak-yak mesanjem - kadomash kor kunad.
  const fields = ["Image", "Images", "File", "file", "imageFile"];

  // Nomi fayl faqat az harfhoi lotini - ba'ze serverho nomi rusi/tojikiro
  // qabul namekunand.
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
        token,
        form,
      });
    } catch (err) {
      last = err;

      // Agar khato "maidoni nodurust" bosad - nomi digarro mesanjem.
      // Agar khatoi digar bosad (masalan 401) - darhol ist mekunem.
      const text = err instanceof ApiError ? err.messages.join(" ") : "";
      const wrongField =
        text.includes("Unexpected field") ||
        text.toLowerCase().includes("unsupported file type");

      if (!wrongField) throw err;
    }
  }

  throw last;
}

// DELETE /Story/DeleteStory
export function deleteStory(token: string, id: number) {
  return request<string>("/Story/DeleteStory", {
    method: "DELETE",
    token,
    query: { id },
  });
}

// POST /Story/add-story-view  -> prosmotri story
export function viewStory(token: string, storyId: number) {
  return request<string>("/Story/add-story-view", {
    method: "POST",
    token,
    query: { StoryId: storyId },
  });
}

// ============================================================
//  FOLOWERS / FOLOWING
// ============================================================

// GET /FollowingRelationShip/get-subscribers -> FOLOWERS
export function getFollowers(token: string, userId: string) {
  return request<FollowUser[]>("/FollowingRelationShip/get-subscribers", {
    token,
    query: { UserId: userId },
  });
}

// GET /FollowingRelationShip/get-subscriptions -> FOLOWING
export function getFollowing(token: string, userId: string) {
  return request<FollowUser[]>("/FollowingRelationShip/get-subscriptions", {
    token,
    query: { UserId: userId },
  });
}

// POST /FollowingRelationShip/add-following-relation-ship
export function follow(token: string, userId: string) {
  return request<string>("/FollowingRelationShip/add-following-relation-ship", {
    method: "POST",
    token,
    query: { followingUserId: userId },
  });
}

// DELETE /FollowingRelationShip/delete-following-relation-ship
export function unfollow(token: string, userId: string) {
  return request<string>(
    "/FollowingRelationShip/delete-following-relation-ship",
    { method: "DELETE", token, query: { followingUserId: userId } }
  );
}

// ============================================================
//  KOMMENTHO
// ============================================================

// GET /Comment/get-post-comments
export function getPostComments(token: string, postId: number) {
  return request<Comment[]>("/Comment/get-post-comments", {
    token,
    query: { PostId: postId, PageNumber: 1, PageSize: 50 },
  });
}

// GET /Comment/get-reels-comments
export function getReelComments(token: string, reelsId: number) {
  return request<Comment[]>("/Comment/get-reels-comments", {
    token,
    query: { ReelsId: reelsId, PageNumber: 1, PageSize: 50 },
  });
}

// POST /Comment/add-comment
export function addComment(
  token: string,
  body: { comment: string; postId?: number; reelsId?: number }
) {
  return request<Comment>("/Comment/add-comment", {
    method: "POST",
    token,
    json: body,
  });
}

// ============================================================
//  SAQLSHUDAHO (favorites)
// ============================================================

// GET /UserProfile/get-post-favorites
export function getFavoritePosts(token: string) {
  return request<Post[]>("/UserProfile/get-post-favorites", {
    token,
    query: { PageNumber: 1, PageSize: 50 },
  });
}

// POST /Post/add-post-favorite
export function toggleFavoritePost(token: string, postId: number) {
  return request<string>("/Post/add-post-favorite", {
    method: "POST",
    token,
    json: { postId },
  });
}
