"use client";

// ============================================================
//  /Auth/login
//  1. korbar menavisad -> useState
//  2. POST /Account/login -> token
//  3. token-ro bo GET /UserProfile/get-my-profile MESANJEM
//  4. agar kor kard -> ba /profile meravem (sahifai alohida)
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, getMyProfile, loginUser } from "../api";
import { saveToken } from "../token";
import { useSettings } from "../providers";
import styles from "../auth.module.css";

import Field from "../components/Field";
import Submit from "../components/Submit";
import { Alert } from "../ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useSettings();

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
      await getMyProfile(token);

      // 3) faqat ba'di sanjish nigoh medorem
      saveToken(token);

      router.push("/profile");
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
