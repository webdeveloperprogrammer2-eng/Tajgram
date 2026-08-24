// ============================================================
//  app/Auth/api.ts
//  In fayl FAQAT bo server (backend) gap mezanad.
//  Hech design in jo nest - faqat logika.
//
//  Swagger: https://instagram-back-qibs.onrender.com/docs/
// ============================================================

// 1) Manzili VOQEI-i backend. Faqat baroi SURATHO istifoda meshavad
//    (<img src=...> ba CORS ehtiyoj nadorad).
export const BACKEND_URL = "https://instagram-back-qibs.onrender.com";

// 2) Hamai so'rovhoi fetch az PROXY-i khudamon meguzarand.
//    Sabab: backend sarlavhai Access-Control-Allow-Origin namefiristad,
//    baroi hamin browser so'rovi mustaqimro band mekunad (CORS).
//    Proxy dar app/Auth/proxy/[...path]/route.ts ast.
export const API_URL = "/Auth/proxy";

// 2) Server HAMESHA javobro dar hamin shakl mefiristad:
//    { data: ..., errors: [...], statusCode: 200 }
export type ApiResponse<T> = {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
};

// ------------------------------------------------------------
//  3) QOIDAHOI SERVER
//  In raqamho az khudi backend girifta shudand (man sanjidam).
//  Sanjishi tarafi mo AYNAN hamin bosad - na kamtar, na beshtar.
// ------------------------------------------------------------
export const RULES = {
  userNameMin: 3,   // server: "String must contain at least 3 character(s)"
  userNameMax: 50,  // server: "String must contain at most 50 character(s)"
  fullNameMin: 1,   // server: "String must contain at least 1 character(s)"
  passwordMin: 6,   // server: "String must contain at least 6 character(s)"
} as const;

// 4) Shakli ma'lumot baroi REGISTER (POST /Account/register)
export type RegisterForm = {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// 5) Shakli ma'lumot baroi LOGIN (POST /Account/login)
export type LoginForm = {
  userName: string;
  password: string;
};

// 6) Profili korbar (GET /UserProfile/get-my-profile)
export type MyProfile = {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  about: string | null;
  gender: string | null;
  image: string | null;
  postCount: number;
  subscribersCount: number;
  subscriptionsCount: number;
};

// ------------------------------------------------------------
//  ApiError - khatoi ki AZ SERVER omad.
//  Server metavonad chand khato yakbora firistad, baroi hamin
//  onhoro dar `messages` (massiv) nigoh medorem.
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
//  readAnswer - javobi serverro mekhonad.
//  Agar hama chiz durust bosad -> `data` bar megardonad.
//  Agar khato bosad -> ApiError mepartoyad bo HAMAI khatoho.
// ------------------------------------------------------------
async function readAnswer<T>(response: Response): Promise<T> {
  let json: ApiResponse<T> | null = null;

  // Ba'ze vaqt server matni oddi mefiristad, na JSON.
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (!response.ok) {
    // Server khatohoro bo "; " yakjo mekunad -> mo onhoro judo mekunem,
    // ki har khato dar satri alohida namoyon shavad.
    const raw = json?.errors ?? [];
    const list = raw.flatMap((line) => line.split("; ")).filter(Boolean);

    throw new ApiError(
      list.length > 0 ? list : [`HTTP ${response.status}`],
      json?.statusCode ?? response.status
    );
  }

  return json?.data as T;
}

// ------------------------------------------------------------
//  toApiError - agar internet nabosad, fetch khudash khato mepartoyad.
//  Onro ham ba ApiError tabdil medihem, ki dar yak jo kor kunem.
// ------------------------------------------------------------
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(["NETWORK"], 0); // 0 = server javob nadod
}

// ------------------------------------------------------------
//  REGISTER - POST /Account/register
//  Bar megardonad: matni javobi server
//  ("Registration completed successfully")
// ------------------------------------------------------------
export async function registerUser(form: RegisterForm): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/Account/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    return await readAnswer<string>(response);
  } catch (err) {
    throw toApiError(err);
  }
}

// ------------------------------------------------------------
//  LOGIN - POST /Account/login
//  Bar megardonad: TOKEN (JWT)
// ------------------------------------------------------------
export async function loginUser(form: LoginForm): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/Account/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    return await readAnswer<string>(response);
  } catch (err) {
    throw toApiError(err);
  }
}

// ------------------------------------------------------------
//  GET /UserProfile/get-my-profile
//  Bo hamin mesanjem, ki token DAR HAQIQAT kor mekunad.
//  Server intizori sarlavhai: Authorization: Bearer <token>
// ------------------------------------------------------------
export async function getMyProfile(token: string): Promise<MyProfile> {
  try {
    const response = await fetch(`${API_URL}/UserProfile/get-my-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return await readAnswer<MyProfile>(response);
  } catch (err) {
    throw toApiError(err);
  }
}

// ------------------------------------------------------------
//  GET /health - server zinda ast yo ne?
//  Bar megardonad: vaqti javob (millisekund) va vaqti server.
// ------------------------------------------------------------
export type Health = {
  ok: boolean;
  ms: number;           // chand millisekund javob dod
  serverTime: string | null;
};

export async function checkHealth(): Promise<Health> {
  const start = Date.now();

  try {
    const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
    const json = (await response.json()) as ApiResponse<{
      status: string;
      time: string;
    }>;

    return {
      ok: response.ok && json.data?.status === "ok",
      ms: Date.now() - start,
      serverTime: json.data?.time ?? null,
    };
  } catch {
    return { ok: false, ms: Date.now() - start, serverTime: null };
  }
}

// ------------------------------------------------------------
//  PUT /UserProfile/update-user-image-profile
//  Surat AZ KOMPYUTER firistoda meshavad - multipart/form-data.
//  Nomi maidon dar server: "imageFile" (man sanjidam).
//  DIQQAT: Content-Type-ro KHUDAMON namenavisem!
//  Browser onro khudash bo "boundary" durust mesozad.
// ------------------------------------------------------------
export async function uploadAvatar(token: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("imageFile", file);

  try {
    const response = await fetch(
      `${API_URL}/UserProfile/update-user-image-profile`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    // Bar megardonad rohi surat, masalan "images/abc.png"
    return await readAnswer<string>(response);
  } catch (err) {
    throw toApiError(err);
  }
}

// ------------------------------------------------------------
//  DELETE /UserProfile/delete-user-image-profile
// ------------------------------------------------------------
export async function deleteAvatar(token: string): Promise<string> {
  try {
    const response = await fetch(
      `${API_URL}/UserProfile/delete-user-image-profile`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return await readAnswer<string>(response);
  } catch (err) {
    throw toApiError(err);
  }
}

// ------------------------------------------------------------
//  Server rohi kutoh medihad ("images/abc.png").
//  Baroi <img src=...> adresi purra lozim ast.
// ------------------------------------------------------------
export function imageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${BACKEND_URL}/${path}`;
}
