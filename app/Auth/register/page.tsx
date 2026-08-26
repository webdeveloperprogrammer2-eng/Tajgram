"use client";

// ============================================================
//  /Auth/register
//  Dizayn: ayni hamon rasmi reference (New Account) + surati profil
// ============================================================
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ApiError, RULES, loginUser, registerUser, uploadAvatar } from "../api";
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

  const [avatar, setAvatar] = useState<{ file: File; url: string } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    const url = avatar?.url;
    if (url === undefined) return;
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  function clearAvatar() {
    setAvatar(null);
    if (avatarInput.current !== null) avatarInput.current.value = "";
  }

  function pickAvatar(file: File | undefined) {
    if (file === undefined) return;
    if (!file.type.startsWith("image/")) {
      setErrors(["Фақат акс гузоштан мумкин аст."]);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(["Акос аз 5 МБ калон аст."]);
      return;
    }
    setErrors([]);
    setAvatar({ file, url: URL.createObjectURL(file) });
  }

  const power = checkPasswordPower(password);
  const powerNames = [
    t.strength0,
    t.strength1,
    t.strength2,
    t.strength3,
    t.strength4,
  ];

  let strengthColor = "bg-[var(--line)]";
  if (power === 1) strengthColor = "bg-red-500";
  else if (power === 2) strengthColor = "bg-amber-500";
  else if (power === 3) strengthColor = "bg-emerald-500";
  else if (power === 4) strengthColor = "bg-emerald-600";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);
    setSuccess("");
    setUserNameError("");
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;
    if (userName.trim().length < RULES.userNameMin) {
      setUserNameError(t.errUserShort);
      hasError = true;
    }
    if (userName.trim().length > RULES.userNameMax) {
      setUserNameError(t.errUserLong);
      hasError = true;
    }
    if (fullName.trim().length < RULES.fullNameMin) {
      setFullNameError(t.errFullName);
      hasError = true;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setEmailError(t.errEmail);
      hasError = true;
    }
    if (password.length < RULES.passwordMin) {
      setPasswordError(t.errShort);
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t.errMatch);
      hasError = true;
    }
    if (hasError) return;

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

      if (avatar !== null) {
        try {
          await uploadAvatar(token, avatar.file);
        } catch {
          // Surati profilро баъдтар дар саҳифаи профил иваз кардан мумкин аст
        }
      }

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
        <h2 className="font-sans text-2xl font-extrabold tracking-tight sm:text-3xl text-[var(--fg)]">
          {t.registerTitle}
        </h2>
        <p className="mt-2.5 text-xs font-semibold text-[var(--muted)]">
          {t.registerSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Акси профил (ихтиёрӣ) */}
        <div className="flex items-center gap-4 py-2 border border-[var(--line)] bg-[var(--panelSoft)] rounded-2xl px-4 shadow-sm">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className={styles.avatarPick}
            aria-label="Сурати профил гузоред"
          >
            {avatar === null ? (
              <span className={styles.avatarPickPlus}>+</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar.url} alt="" className={styles.avatarPickImg} />
            )}
          </button>

          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[var(--fg)]">Сурати профил</p>
            <p className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>
              Ихтиёрӣ — баъд ҳам иваз кардан мумкин аст
            </p>

            {avatar !== null && (
              <button
                type="button"
                onClick={clearAvatar}
                className="mt-1 text-[11px] font-bold underline cursor-pointer"
                style={{ color: "var(--danger)" }}
              >
                Тоза кардан
              </button>
            )}
          </div>

          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => pickAvatar(event.target.files?.[0])}
          />
        </div>

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
          hint={t.hintUserName}
          error={userNameError}
        />

        <Field
          label={t.fieldFullName}
          name="fullName"
          value={fullName}
          onChange={(val) => {
            setFullName(val);
            if (fullNameError) setFullNameError("");
          }}
          placeholder="Номи пурраи худро ворид кунед..."
          autoComplete="name"
          error={fullNameError}
        />

        <Field
          label={t.fieldEmail}
          name="email"
          type="email"
          value={email}
          onChange={(val) => {
            setEmail(val);
            if (emailError) setEmailError("");
          }}
          placeholder="Почтаи электронии худро ворид кунед..."
          autoComplete="email"
          error={emailError}
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
          autoComplete="new-password"
          hint={t.hintPassword}
          error={passwordError}
        />

        {password !== "" && (
          <div className="flex items-center justify-between gap-4 pt-1 px-1">
            <div className="flex flex-1 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < power ? strengthColor : "bg-[var(--line)]"
                  }`}
                />
              ))}
            </div>

            <span
              className="text-[11px] font-bold opacity-80"
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
          onChange={(val) => {
            setConfirmPassword(val);
            if (confirmPasswordError) setConfirmPasswordError("");
          }}
          placeholder="Такрори паролро ворид кунед..."
          autoComplete="new-password"
          error={confirmPasswordError}
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

        <div className="pt-3">
          <Submit
            label={t.registerSubmit}
            loadingLabel={t.registerLoading}
            loading={loading}
          />
        </div>
      </form>

      <p className="mt-6 text-center text-xs font-semibold opacity-85 text-[var(--fg)]">
        <span>Аллакай аккаунт доред? </span>
        <Link
          href="/Auth/login"
          className="font-bold underline hover:opacity-100 transition-opacity"
          style={{ color: "var(--brand)" }}
        >
          {t.tabLogin}
        </Link>
      </p>
    </div>
  );
}
