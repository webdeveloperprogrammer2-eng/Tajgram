// ============================================================
//  app/chats/api.ts
//  In fayl FAQAT bo backend gap mezanad. Hech dizayn in jo nest.
//
//  Swagger: https://instagram-back-qibs.onrender.com/docs/
//  Endpoint-hoi CHAT (aynan az swagger):
//    GET    /Chat/get-chats                       -> GetChatDto[]
//    GET    /Chat/get-chat-by-id?chatId=1         -> GetMessageDto[]
//    POST   /Chat/create-chat?receiverUserId=...  -> chatId (integer)
//    PUT    /Chat/send-message  (multipart: ChatId, MessageText, File)
//    DELETE /Chat/delete-message?massageId=1      (imlo AZ SWAGGER)
//    DELETE /Chat/delete-chat?chatId=1
//
//  Baroi "bo ki navishtan mumkin ast":
//    GET /FollowingRelationShip/get-subscribers?UserId=...   (ba man podpiska)
//    GET /FollowingRelationShip/get-subscriptions?UserId=... (man podpiska)
//
//  QOIDA: hech ma'lumoti soakhta (demo/test) in jo NEST.
// ============================================================

// Manzili VOQEI-i backend - faqat baroi SURAT va FAYL
export const BACKEND_URL = "https://instagram-back-qibs.onrender.com";

// Hamai fetch-ho az proxy-i khudi papkai chats meguzarand (CORS)
export const API_URL = "/chats/proxy";

// Server HAMESHA javobro dar hamin shakl mefiristad
export type ApiResponse<T> = {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
};

// ------------------------------------------------------------
//  1) TYPE-HO (az swagger: components.schemas)
// ------------------------------------------------------------

// GetUserProfileDto - faqat maidonhoi ba mo lozim
export type MyProfile = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
};

// GetChatDto
export type Chat = {
  chatId: number;
  userId: string; // hamsuhbat
  userName: string;
  fullName: string;
  userImage: string | null;
  lastMessage: string | null;
  lastMessageDate: string | null;
  createdAt: string;
};

// GetMessageDto
export type Message = {
  messageId: number;
  chatId: number;
  userId: string;
  userName: string;
  messageText: string | null;
  fileName: string | null;
  dateSent: string;
  isMine: boolean;
};

// FollowUserDto
export type FollowUser = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  isFollowing: boolean;
};

// ------------------------------------------------------------
//  2) ADRESI FAYLHO ("images/abc.jpg" -> adresi purra)
// ------------------------------------------------------------
export function mediaUrl(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name.startsWith("http")) return name;
  return `${BACKEND_URL}/${name.replace(/^\/+/, "")}`;
}

// Fayl surat ast yo ne (baroi namoishi daruni chat)
export function isImageFile(name: string | null | undefined): boolean {
  if (!name) return false;
  return /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(name);
}

export function isVideoFile(name: string | null | undefined): boolean {
  if (!name) return false;
  return /\.(mp4|webm|mov|m4v)$/i.test(name);
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

  console.error(`[chats] so-rov narasid: ${path}`, err);

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
  if (status === 413) return "Fayl khele kalon ast. Khurdtarashro intikhob kuned.";
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
  form?: FormData;
};

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", token, query, json, form } = options;

  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    }
  }
  const tail = search.toString() === "" ? "" : `?${search.toString()}`;

  // DIQQAT: baroi FormData "Content-Type"-ro MO nameguzorem -
  // browser khudash onro bo "boundary"-i durust meguzorad.
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
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
//  PROFIL (baroi donistani userId-i KHUDAM)
// ============================================================

// GET /UserProfile/get-my-profile
export function getMyProfile(token: string) {
  return request<MyProfile>("/UserProfile/get-my-profile", { token });
}

// ============================================================
//  CHAT
// ============================================================

// GET /Chat/get-chats
export function getChats(token: string) {
  return request<Chat[]>("/Chat/get-chats", { token });
}

// GET /Chat/get-chat-by-id?chatId=1  -> payomhoi hamin chat
export function getChatMessages(token: string, chatId: number) {
  return request<Message[]>("/Chat/get-chat-by-id", {
    token,
    query: { chatId },
  });
}

// POST /Chat/create-chat?receiverUserId=...  -> chatId
export function createChat(token: string, receiverUserId: string) {
  return request<number>("/Chat/create-chat", {
    method: "POST",
    token,
    query: { receiverUserId },
  });
}

// PUT /Chat/send-message  (multipart/form-data)
//   ChatId (hatmi) | MessageText | File
export function sendMessage(
  token: string,
  input: { chatId: number; text: string; file: File | null }
) {
  const form = new FormData();
  form.append("ChatId", String(input.chatId));

  if (input.text.trim() !== "") form.append("MessageText", input.text.trim());
  if (input.file !== null) form.append("File", input.file);

  return request<Message>("/Chat/send-message", {
    method: "PUT",
    token,
    form,
  });
}

// DELETE /Chat/delete-message?massageId=1
// (nomi parametr dar swagger AYNAN chunin ast - "massageId")
export function deleteMessage(token: string, messageId: number) {
  return request<string>("/Chat/delete-message", {
    method: "DELETE",
    token,
    query: { massageId: messageId },
  });
}

// DELETE /Chat/delete-chat?chatId=1
export function deleteChat(token: string, chatId: number) {
  return request<string>("/Chat/delete-chat", {
    method: "DELETE",
    token,
    query: { chatId },
  });
}

// ============================================================
//  PODPISKAHO - qoidai asosi:
//  navishtan FAQAT bo onhoe mumkin ast ki
//    - ba man podpiska kardaand (subscribers), yo
//    - man ba onho podpiska kardaam (subscriptions)
// ============================================================

// GET /FollowingRelationShip/get-subscribers?UserId=...
export function getSubscribers(token: string, userId: string) {
  return request<FollowUser[]>("/FollowingRelationShip/get-subscribers", {
    token,
    query: { UserId: userId },
  });
}

// GET /FollowingRelationShip/get-subscriptions?UserId=...
export function getSubscriptions(token: string, userId: string) {
  return request<FollowUser[]>("/FollowingRelationShip/get-subscriptions", {
    token,
    query: { UserId: userId },
  });
}
