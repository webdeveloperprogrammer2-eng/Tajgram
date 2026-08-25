// ============================================================
//  components/themeKeys.ts
//
//  FAQAT konstantaho - hech kodi browser (localStorage/document)
//  in jo nest. Baroi hamin server-component-ho (app/layout.tsx)
//  metavonand bе khavf az in jo bikhonand.
//
//  CHARO judo shud?
//  appTheme.ts ham az server, ham az client kashida meshud va
//  Turbopack du nusxai gunogun mesokht -> khatoi
//  "Export syncThemeCookie doesn't exist in target module".
// ============================================================

export type AppTheme = "dark" | "light";

export const THEME_KEY = "tajgram_theme";
export const TOKEN_KEY = "tajgram_token";

// Har bor ki naql ivaz shavad - hamai provider-ho khabar megirand
export const THEME_EVENT = "tajgram-theme";
