"use client";

// ============================================================
//  /Auth/register
//  Dizayn: ayni hamon rasmi reference (New Account)
// ============================================================
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, RULES, loginUser, registerUser } from "../api";
import { saveToken } from "../token";
import { useSettings } from "../providers";
import styles from "../auth.module.css";

import Field from "../components/Field";
import Submit from "../components/Submit";
import { Alert } from "../ui/alert";

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
      <div className="text-center">
        <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
          {t.registerTitle}
        </h2>
        <p className="mt-1.5 text-xs font-medium opacity-75" style={{ color: "var(--muted)" }}>
          {t.registerSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
        <Field
          label={t.fieldUsername}
          name="userName"
          value={userName}
          onChange={setUserName}
          placeholder="Номи корбарро ворид кунед..."
          autoComplete="username"
          autoFocus
          hint={t.hintUserName}
        />

        <Field
          label={t.fieldFullName}
          name="fullName"
          value={fullName}
          onChange={setFullName}
          placeholder="Номи пурраи худро ворид кунед..."
          autoComplete="name"
        />

        <Field
          label={t.fieldEmail}
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Почтаи электронии худро ворид кунед..."
          autoComplete="email"
        />

        <Field
          label={t.fieldPassword}
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Паролро ворид кунед..."
          autoComplete="new-password"
          hint={t.hintPassword}
        />

        {password !== "" && (
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-150"
                  style={{
                    background:
                      i < power
                        ? "var(--fg)"
                        : "var(--line)",
                  }}
                />
              ))}
            </div>

            <span
              className="text-[11px] font-medium opacity-80"
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
          placeholder="Такрори паролро ворид кунед..."
          autoComplete="new-password"
        />

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

        {success !== "" && (
          <Alert variant="success">
            <span className="text-xs">{success}</span>
          </Alert>
        )}

        <div className="pt-2">
          <Submit
            label={t.registerSubmit}
            loadingLabel={t.registerLoading}
            loading={loading}
          />
        </div>
      </form>

      {/* Обуна шудан / Даромадан link */}
      <p className="mt-5 text-center text-xs font-medium opacity-85">
        <span>Аллакай аккаунт доред? </span>
        <Link
          href="/Auth/login"
          className="font-semibold underline hover:opacity-100 transition-opacity"
          style={{ color: "var(--fg)" }}
        >
          {t.tabLogin}
        </Link>
      </p>
    </div>
  );
}
