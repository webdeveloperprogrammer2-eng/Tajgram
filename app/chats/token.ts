// ============================================================
//  app/chats/token.ts
//  Token-i korbar dar localStorage nigoh doshta meshavad.
//  KALID ayni hamon kalidi Auth ast ("tajgram_token"),
//  baroi hamin ba'di login profil darhol korbarro meshinosad.
//  Fayli alohida - ki papkai chats mustaqil bosad.
// ============================================================

const TOKEN_KEY = "tajgram_token";

// Token-ro megirem. `window` faqat dar browser hast, dar server nest.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Token-ro toza mekunem (logout)
export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ------------------------------------------------------------
//  Daruni token (JWT) ma'lumoti korbar hast.
//  JWT az 3 qism iborat: header.payload.signature
//  Mo faqat qismi MIYONA (payload)-ro mekhonem.
//  In faqat baroi namoish ast - haqiqat hamesha az server meoyad.
// ------------------------------------------------------------
export type TokenUser = {
  sub: string;       // userId
  userName: string;
  email: string;
  exp: number;       // vaqti tamomshavi (sekund)
};

export function readToken(token: string): TokenUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url -> base64 -> matn
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const text = atob(base64);

    return JSON.parse(text) as TokenUser;
  } catch {
    return null;
  }
}

// Token guzashtaast yo ne?
export function isTokenExpired(token: string): boolean {
  const user = readToken(token);
  if (user === null) return true;
  return user.exp * 1000 <= Date.now();
}
