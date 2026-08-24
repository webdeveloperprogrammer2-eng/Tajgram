"use client";

// ============================================================
//  /Auth/register
//  Sanjishhoi mo AYNAN qoidahoi server hastand (RULES az api.ts).
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, RULES, loginUser, registerUser } from "../api";
import { saveToken } from "../token";
import { useSettings } from "../providers";
import styles from "../auth.module.css";

import Field from "../components/Field";
import Submit from "../components/Submit";
import { Alert } from "../ui/alert";

// Quvvati parol: 0..4
function checkPasswordPower(password: string): number {
  let power = 0;
  if (password.length >= RULES.passwordMin) power++;
  if (/[A-Z]/.test(password)) power++;
  if (/[0-9]/.test(password)) power++;
  if (/[^A-Za-z0-9]/.test(password)) power++;
  return power;
}

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useSettings();

  const [userName, setUserName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");

  const power = checkPasswordPower(password);
  const powerNames = [
    t.strength0,
    t.strength1,
    t.strength2,
    t.strength3,
    t.strength4,
  ];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");

    // ---- Sanjishho: aynan misli server ----
    if (userName.trim().length < RULES.userNameMin) {
      setErrors([t.errUserShort]);
      return;
    }
    if (userName.trim().length > RULES.userNameMax) {
      setErrors([t.errUserLong]);
      return;
    }
    if (fullName.trim().length < RULES.fullNameMin) {
      setErrors([t.errFullName]);
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setErrors([t.errEmail]);
      return;
    }
    if (password.length < RULES.passwordMin) {
      setErrors([t.errShort]);
      return;
    }
    if (password !== confirmPassword) {
      setErrors([t.errMatch]);
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        userName,
        fullName,
        email,
        password,
        confirmPassword,
      });

      // Account sokhta shud. Server hangomi register TOKEN NAMEDIHAD,
      // baroi hamin mo DARHOL khudamon login mekunem - bo ayni
      // hamon userName va parole ki korbar navisht.
      // Ba'd korbar rost ba sahifai PROFIL meravad (na ba login).
      const token = await loginUser({ userName, password });
      saveToken(token);

      setSuccess(t.okCreated);
      router.push("/profile");
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
      <h2
        className={styles.display}
        style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)" }}
      >
        {t.registerTitle}
      </h2>

      <p className="mt-3 text-[14px]" style={{ color: "var(--muted)" }}>
        {t.registerSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Field
          label={t.fieldUsername}
          name="userName"
          value={userName}
          onChange={setUserName}
          autoComplete="username"
          autoFocus
          hint={t.hintUserName}
        />

        <Field
          label={t.fieldFullName}
          name="fullName"
          value={fullName}
          onChange={setFullName}
          autoComplete="name"
        />

        <Field
          label={t.fieldEmail}
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <Field
          label={t.fieldPassword}
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={t.hintPassword}
        />

        {/* Quvvati parol - 4 khati tunuk */}
        {password !== "" && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background:
                      i < power
                        ? "linear-gradient(90deg, var(--accentA), var(--accentB))"
                        : "var(--panel)",
                  }}
                />
              ))}
            </div>

            <span
              className="text-[12px] font-medium"
              style={{ color: "var(--muted)" }}
            >
              {powerNames[power]}
            </span>
          </div>
        )}

        <Field
          label={t.fieldConfirm}
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
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

        {success !== "" && (
          <Alert variant="success">
            <span>{success}</span>
          </Alert>
        )}

        <Submit
          label={t.registerSubmit}
          loadingLabel={t.registerLoading}
          loading={loading}
        />

        <p
          className="text-[12px] leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          {t.terms}
        </p>
      </form>
    </div>
  );
}
