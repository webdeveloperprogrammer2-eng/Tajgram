"use client";

// ============================================================
//  /Auth/login
//  1. korbar menavisad -> useState
//  2. POST /Account/login -> token
//  3. token-ro bo GET /UserProfile/get-my-profile MESANJEM
//  4. agar kor kard -> ba /profile meravem (sahifai alohida)
// ============================================================
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  // Server metavonad CHAND khato yakbora firistad -> massiv
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);

    if (userName.trim() === "" || password.trim() === "") {
      setErrors([t.errFillAll]);
      return;
    }

    setLoading(true);

    try {
      // 1) token megirem
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
        // "NETWORK" ya'ne server umuman javob nadod
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
      <h2
        className={styles.display}
        style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)" }}
      >
        {t.loginTitle}
      </h2>

      <p className="mt-3 text-[15px]" style={{ color: "var(--muted)" }}>
        {t.loginSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-6">
        <Field
          label={t.fieldUsername}
          name="userName"
          value={userName}
          onChange={setUserName}
          autoComplete="username"
          autoFocus
        />

        <Field
          label={t.fieldPassword}
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {errors.length > 0 && (
          <Alert variant="destructive" className={styles.nudge}>
            <span className="space-y-1">
              {errors.map((message) => (
                <span key={message} className="block">
                  {message}
                </span>
              ))}
            </span>
          </Alert>
        )}

        <Submit
          label={t.loginSubmit}
          loadingLabel={t.loginLoading}
          loading={loading}
        />
      </form>

      <p
        className="mt-8 border-t pt-6 text-[13px]"
        style={{ borderColor: "var(--line)", color: "var(--muted)" }}
      >
        {t.forgot}
      </p>
    </div>
  );
}
