"use client";

// ============================================================
//  /Auth/Register
//  Sanjishhoi mo AYNAN qoidahoi server hastand (RULES az api.ts).
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, RULES, loginUser, registerUser, uploadAvatar } from "../api";
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

  // ---------- SURATI PROFIL ----------
  // Faylro dar khotira nigoh medorem; ba server BA'DI login
  // mefiristem (register khudash suratro qabul namekunad).
  // Fayl va peshnamoyishash YAKJO nigoh doshta meshavand -
  // to dar effect setState nakunem (React inro maslihat namedihad).
  const [avatar, setAvatar] = useState<{ file: File; url: string } | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");

  // URL-i muvaqqati khotira band mekunad. Har bor ki surat ivaz
  // shavad yo sahifa basta shavad - onro ozod mekunem.
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
      setErrors(["Faqat surat guzoshtan mumkin ast."]);
      return;
    }
    // 5 MB - ki server rad nakunad
    if (file.size > 5 * 1024 * 1024) {
      setErrors(["Surat az 5 MB kalontar ast."]);
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

      // Agar korbar surat guzoshta boshad - hozir mefiristem.
      // Agar surat naguzarad, registratsiya bekor NAMESHAVAD -
      // account allakay tayor ast, suratro ba'd ivaz kardan mumkin.
      if (avatar !== null) {
        try {
          await uploadAvatar(token, avatar.file);
        } catch {
          // khomush - dar sahifai profil ivaz karda meshavad
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
        {/* ---------- SURATI PROFIL (ikhtiyori) ---------- */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className={styles.avatarPick}
            aria-label="Surati profil guzored"
          >
            {avatar === null ? (
              <span className={styles.avatarPickPlus}>+</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar.url} alt="" className={styles.avatarPickImg} />
            )}
          </button>

          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Surati profil</p>
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              Ikhtiyori — ba&apos;d ham ivaz kardan mumkin
            </p>

            {avatar !== null && (
              <button
                type="button"
                onClick={clearAvatar}
                className="mt-1 text-[12px] underline"
                style={{ color: "var(--muted)" }}
              >
                Tark kardan
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
