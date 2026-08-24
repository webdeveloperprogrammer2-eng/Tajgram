// ============================================================
//  app/Auth/token.ts
//  Token-ro dar browser (localStorage) nigoh medorem.
//  Baroi hamin 3 funksiyai khele oddi kifoya ast.
// ============================================================

const TOKEN_KEY = "tajgram_token";

// Token-ro nigoh medorem (ba'di login-i muvaffaq)
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Token-ro megirem.
// Diqqat: `window` faqat dar browser hast, dar server nest.
// Baroi hamin avval mesanjem.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Token-ro toza mekunem (logout)
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ------------------------------------------------------------
//  Daruni token (JWT) ma'lumot hast: userName, email, vaqti tamom.
//  Token az 3 qism iborat ast, bo nuqta judo shuda.
//  Qismi MIYONA ma'lumot ast (base64).
// ------------------------------------------------------------
export type TokenData = {
  sub: string;
  userName: string;
  email: string;
  exp: number; // vaqti tamomshavi (sekund)
};

export function readToken(token: string): TokenData | null {
  try {
    const middle = token.split(".")[1];
    const json = atob(middle.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as TokenData;
  } catch {
    return null;
  }
}

// Token hanuz zinda ast?
export function isTokenAlive(token: string): boolean {
  const data = readToken(token);
  if (!data) return false;
  return data.exp * 1000 > Date.now();
}
