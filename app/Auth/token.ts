// ============================================================
//  app/Auth/token.ts
//  Hamai kor dar lib/auth.ts ast - in jo faqat nomhoi
//  kuhnaro bar megardonem, ki kodi mavjud nashikanad.
// ============================================================

export {
  getToken,
  saveToken,
  clearToken as removeToken,
  readToken,
  type TokenUser as TokenData,
} from "@/lib/auth";

import { isTokenExpired } from "@/lib/auth";

/** Token hanuz zinda ast? */
export function isTokenAlive(token: string): boolean {
  return !isTokenExpired(token);
}
