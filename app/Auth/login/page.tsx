"use client";

// ============================================================
//  /Auth/login
//  Dizayn: ayni hamon rasmi reference (Welcome Back to Tajgram)
// ============================================================
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ApiError, getMyProfile, loginUser } from "../api";
import { saveToken } from "../token";
import { useSettings } from "../providers";
import styles from "../auth.module.css";

import Field from "../components/Field";
import Submit from "../components/Submit";
import { Alert } from "../ui/alert";

// ------------------------------------------------------------
//  Ban - dar server-i KHUDAMON nigoh doshta meshavad
//  (backend inро namedonad). /api/admin/ban-status kushoda ast.
// ------------------------------------------------------------
type BanInfo = { until: number | null; reason: string };

async function checkBan(userId: string): Promise<BanInfo | null> {
  try {
    const res = await fetch(
      `/api/admin/ban-status?userId=${encodeURIComponent(userId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      banned: boolean;
      until: number | null;
      reason: string;
    };
    return data.banned ? { until: data.until, reason: data.reason } : null;
  } catch {
    // Agar sanjish nashud - roҳро naməbandem (server-i mahalli).
    return null;
  }
}

function humanLeft(until: number | null): string {
  if (until === null) return "";
  const ms = until - Date.now();
  if (ms <= 0) return "";
  const min = Math.floor(ms / 60_000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} ruz ${h % 24} soat`;
  if (h > 0) return `${h} soat ${min % 60} daq`;
  return `${min} daqiqa`;
}

function formatBan(
  ban: BanInfo,
  t: { bannedTitle: string; bannedForever: string; bannedFor: string },
): string {
  const parts = [t.bannedTitle + "."];
  if (ban.reason) parts.push(`«${ban.reason}»`);
  parts.push(
    ban.until === null
      ? t.bannedForever
      : `${t.bannedFor}: ${humanLeft(ban.until)}.`,
  );
  return parts.join(" ");
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useSettings();

  // AppFrame korbari nadaromadaro ba in jo mefiristad va
  // sahifai avvalaro dar ?next= menavisad. Ba'di daromadan
  // uro ba HAMON jo bar megardonem - monandi instagram.
  const next = params.get("next");

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Field validation errors
  const [userNameError, setUserNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);
    setUserNameError("");
    setPasswordError("");

    let hasError = false;
    if (userName.trim() === "") {
      setUserNameError(t.errFillAll);
      hasError = true;
    }
    if (password.trim() === "") {
      setPasswordError(t.errFillAll);
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);

    try {
      const token = await loginUser({ userName, password });

      // 2) darhol mesanjem: token dar haqiqat kor mekunad?
      const profile = await getMyProfile(token);

      // 3) BAN? Backend banро namedonad - mo dar server-i khud
      //    (/api/admin/ban-status) nigoh medorem. Agar ban zinda
      //    boshad, korbar ba dohil dohil nameshavad.
      const ban = await checkBan(profile.userId);
      if (ban !== null) {
        setErrors([formatBan(ban, t)]);
        return;
      }

      // 4) faqat ba'di sanjish nigoh medorem
      saveToken(token);

      // Korbari "admin" ба paneli idora meravad, na ba lentai Tajgram.
      if (profile.userName === "admin") {
        router.replace("/admin");
        return;
      }

      // Faqat adresi DARUNI sayt - to kase bo ?next=https://...
      // korbarro ba sayti begona nafiristad.
      const back = next !== null && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/";

      router.replace(back);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.messages[0] === "NETWORK" ? [t.errNetwork] : err.messages);
      } else {
        setErrors([t.errUnknown]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.fadeUp}>
      {/* Sarlavha ва зерсарлавҳа */}
      <div className="text-center">
        <h2 className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--fg)]">
          {t.loginTitle}
        </h2>
        <p className="mt-2.5 text-xs font-semibold text-[var(--muted)]">
          {t.loginSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field
          label={t.fieldUsername}
          name="userName"
          value={userName}
          onChange={(val) => {
            setUserName(val);
            if (userNameError) setUserNameError("");
          }}
          placeholder="Номи корбарро ворид кунед..."
          autoComplete="username"
          autoFocus
          error={userNameError}
        />

        <Field
          label={t.fieldPassword}
          name="password"
          type="password"
          value={password}
          onChange={(val) => {
            setPassword(val);
            if (passwordError) setPasswordError("");
          }}
          placeholder="Паролро ворид кунед..."
          autoComplete="current-password"
          error={passwordError}
        />

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group text-xs font-semibold text-[var(--fg)]">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-4.5 w-4.5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                rememberMe
                  ? "bg-[var(--brand)] border-[var(--brand)] text-white shadow-sm shadow-[var(--brand)]/20"
                  : "bg-[var(--panel)] border-[var(--line)] group-hover:border-[var(--lineStrong)]"
              }`}>
                {rememberMe && (
                  <svg className="h-3.5 w-3.5 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
            <span className="opacity-80 group-hover:opacity-100 transition-opacity">
              Маро дар ёд нигоҳ доред
            </span>
          </label>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert(t.forgot);
            }}
            className="text-xs font-bold opacity-80 hover:opacity-100 hover:underline transition-opacity"
            style={{ color: "var(--brand)" }}
          >
            {t.forgot}
          </a>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive" className={styles.nudge}>
            <span className="space-y-1 text-xs">
              {errors.map((message) => (
                <span key={message} className="block">
                  {message}
                </span>
              ))}
            </span>
          </Alert>
        )}

        <div className="pt-3">
          <Submit
            label={t.loginSubmit}
            loadingLabel={t.loginLoading}
            loading={loading}
          />
        </div>
      </form>

      {/* Хати ҷудокунанда ва сосиал логинҳо */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--line)]" />
        </div>
        <span className="relative bg-[var(--glassBg)] px-3 text-[11px] font-bold text-[var(--muted)]">
          ё
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 text-xs font-bold text-[var(--fg)] hover:bg-[var(--panelSoft)] hover:border-[var(--lineStrong)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.2.0 10.05.0 12c0 1.95.46 3.8 1.28 5.42l4-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Google
        </button>

        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 text-xs font-bold text-[var(--fg)] hover:bg-[var(--panelSoft)] hover:border-[var(--lineStrong)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4 fill-current text-[var(--fg)]" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.54c.64-.78 1.08-1.85.96-2.93-.93.04-2.06.62-2.73 1.4-.6.69-1.13 1.8-0.99 2.86 1.05.08 2.12-.55 2.76-1.33z" />
          </svg>
          Apple
        </button>
      </div>

      {/* Обуна шудан / Сабти ном link */}
      <p className="mt-8 text-center text-xs font-semibold opacity-85 text-[var(--fg)]">
        <span>Аккаунт надоред? </span>
        <Link
          href="/Auth/register"
          className="font-bold underline hover:opacity-100 transition-opacity"
          style={{ color: "var(--brand)" }}
        >
          {t.tabRegister}
        </Link>
      </p>
    </div>
  );
}
