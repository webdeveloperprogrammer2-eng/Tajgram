// ============================================================
//  app/chats/token.ts
//
//  Peshtar in fayl NUSKHAI 5-um-i ayni hamon kod bud
//  (chats, reels, search, getInfoUsers, profile - hamash yak khel).
//  Farqi khatarnok: ba'ze onho vaqti tamomshavii tokenro
//  NAMESANJIDAND -> dar yak sahifa korbar "daromada" bud,
//  dar digare "mehmon".
//
//  Hozir hama az YAK JOI umumi mekhonand: lib/auth.ts
// ============================================================

export {
  getToken,
  saveToken,
  clearToken as removeToken,
  readToken,
  isTokenExpired,
  type TokenUser,
} from "@/lib/auth";
