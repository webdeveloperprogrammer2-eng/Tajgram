"use client";

// ============================================================
//  Sahifai NASTROYKA
//
//  Bakhshho:
//    1. Profil     - surat, "dar borai man", jins
//    2. Zohir      - naql (torik/ravshan), zabon
//    3. Makhfiyat   - togglehoi hisob
//    4. Ogohino    - togglehoi khabarho
//    5. Bekhatari  - ivaz kardani parol
//    6. Blokshuda  - ro-ykhat + kushodan
//
//  DIQQAT: swagger /UserProfile/update-user-profile faqat
//  "about" va "gender"-ro qabul mekunad. Ivaz kardani
//  fullName / userName dar backend NEST.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  Bell,
  Camera,
  Check,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  ShieldBan,
  Sun,
  Trash2,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

import { api } from "@/lib/api";
import { unblockUser as unblockLocal, useBlockedList } from "@/lib/blocks";
import type { BlockedUser, Settings } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/components/SessionProvider";
import { useT } from "@/components/LocaleProvider";
import { LANGS, type Dict, type Lang } from "@/components/appLang";
import {
  logoutEverywhere,
  readTheme,
  writeTheme,
  type AppTheme,
} from "@/components/appTheme";

// ------------------------------------------------------------
//  Ro-ykhathoi togglho - du guruh
// ------------------------------------------------------------
// Matn dar lughat ast (components/appLang.ts) - in jo faqat KALID.
const PRIVACY: { key: keyof Settings; label: keyof Dict; hint: keyof Dict }[] = [
  { key: "isPrivateAccount", label: "setPrivate", hint: "setPrivateHint" },
  { key: "showActivityStatus", label: "setActivity", hint: "setActivityHint" },
  { key: "allowComments", label: "setComments", hint: "setCommentsHint" },
  { key: "allowMessages", label: "setMessages", hint: "setMessagesHint" },
  { key: "allowTags", label: "setTags", hint: "setTagsHint" },
];

const NOTIFY: { key: keyof Settings; label: keyof Dict }[] = [
  { key: "notifyLikes", label: "setNotifyLikes" },
  { key: "notifyComments", label: "setNotifyComments" },
  { key: "notifyFollows", label: "setNotifyFollows" },
  { key: "notifyMessages", label: "setNotifyMessages" },
  { key: "emailNotifications", label: "setEmail" },
];

export default function SettingsPage() {
  const { me, refresh } = useSession();
  const { t, lang, setLang } = useT();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const [theme, setTheme] = useState<AppTheme>("dark");
  const [about, setAbout] = useState("");
  const [gender, setGender] = useState<0 | 1 | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passBusy, setPassBusy] = useState(false);

  const [blocked, setBlocked] = useState<BlockedUser[]>([]);

  // Du ro-ykhat: yake az backend, digare az /api/block-i khudamon
  // (kasone ki dar sahifai profil bastaam). In jo onhoro YAK
  // mekunem - to korbar hamai bastagonro dar yak joy bubinad.
  const localBlocked = useBlockedList();

  const allBlocked = useMemo(() => {
    const byId = new Map<
      string,
      {
        userId: string;
        userName: string;
        fullName: string;
        image: string | null;
      }
    >();

    for (const item of blocked) byId.set(item.userId, item);
    for (const item of localBlocked) byId.set(item.userId, item);

    return [...byId.values()];
  }, [blocked, localBlocked]);

  // "Saql shud" - 2 soniya namoyon memonad
  const flash = useCallback((text: string) => {
    setSaved(text);
    setTimeout(() => setSaved(""), 2200);
  }, []);

  // ---------- Bor kardan ----------
  useEffect(() => {
    let alive = true;

    queueMicrotask(() => setTheme(readTheme()));

    Promise.all([
      api.settings(),
      api.blockedUsers().catch(() => null),
    ])
      .then(([response, blockedResponse]) => {
        if (!alive) return;
        setSettings(response.data);
        setBlocked(blockedResponse?.data ?? []);

        // Agar naqli server bo naqli mahalli yakkhela naboshad -
        // az server megirem (u haqiqat ast).
        const fromServer = response.data?.theme;
        if (fromServer === "dark" || fromServer === "light") {
          setTheme(fromServer);
          writeTheme(fromServer);
        }
      })
      .catch((cause: unknown) => {
        if (alive) {
          setError(
            cause instanceof Error ? cause.message : t.settingsLoadFailed
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [t.settingsLoadFailed]);

  // Profil omad -> maidonhoro pur mekunem
  useEffect(() => {
    if (me === null) return;
    queueMicrotask(() => {
      setAbout(me.about ?? "");
      setGender(me.gender ?? null);
    });
  }, [me]);

  // ------------------------------------------------------------
  //  Saql kardani nastroyka
  //
  //  CHARO HAMAI maidonho mefiristem, na faqat yaktoi ivazshuda?
  //  Swagger meno-isad "patch - faqat onchi firistodi ivaz meshavad",
  //  vale dar amal ba'di obnovit nastroykaho ba holati peshina bar
  //  megashtand - yani server maidonhoi NAFIRISTODAro ba qimati
  //  standarti bar megardonad. Baroi hamin HAMA-ro yakbora
  //  mefiristem - dar har du hol durust kor mekunad.
  //
  //  Va javobi serverro dar holat meguzorem - agar server chizero
  //  qabul nakarda boshad, mo FORI hamonro mebinem (na ba'di obnovit).
  // ------------------------------------------------------------
  const save = useCallback(
    async (patch: Partial<Settings>) => {
      if (settings === null) return;

      const before = settings;
      const next = { ...settings, ...patch } as Settings;
      setSettings(next); // fori - to interfeys "yakhbasta" nashavad

      try {
        const response = await api.updateSettings({
          isPrivateAccount: next.isPrivateAccount,
          showActivityStatus: next.showActivityStatus,
          allowComments: next.allowComments,
          allowMessages: next.allowMessages,
          allowTags: next.allowTags,
          notifyLikes: next.notifyLikes,
          notifyComments: next.notifyComments,
          notifyFollows: next.notifyFollows,
          notifyMessages: next.notifyMessages,
          emailNotifications: next.emailNotifications,
          language: next.language,
          theme: next.theme,
        });

        // Haqiqat az server - na taxmini mo
        if (response.data !== null) setSettings(response.data);
        flash(t.settingsSaved);
      } catch {
        setSettings(before);
        setError(t.settingsSaveFailed);
      }
    },
    [settings, flash, t.settingsSaved, t.settingsSaveFailed]
  );

  // ---------- Yak toggle ----------
  function flip(key: keyof Settings) {
    if (settings === null) return;
    void save({ [key]: !settings[key] } as Partial<Settings>);
  }

  // ---------- Zabon ----------
  //  KHATO BUD: in jo faqat ba SERVER menavisht, vale <LocaleProvider>
  //  khabar namegirift - baroi hamin matni sayt ivaz nameshud.
  function pickLanguage(code: Lang) {
    setLang(code);
    void save({ language: code });
  }

  // ---------- Naql ----------
  function pickTheme(next: AppTheme) {
    setTheme(next);
    writeTheme(next); // localStorage + cookie -> ba'di obnovit hamon memonad
    void save({ theme: next });
  }

  // ---------- Surati profil ----------
  async function uploadAvatar(file: File) {
    setAvatarBusy(true);
    setError("");

    try {
      await api.updateAvatar(file);
      await refresh();
      flash(t.photoChanged);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.photoUploadError);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function dropAvatar() {
    setAvatarBusy(true);
    try {
      await api.deleteAvatar();
      await refresh();
      flash(t.photoRemoved);
    } catch {
      setError(t.photoRemoveError);
    } finally {
      setAvatarBusy(false);
    }
  }

  // ---------- "Dar borai man" + jins ----------
  async function saveProfile() {
    setSavingProfile(true);
    setError("");

    try {
      await api.updateProfile({ about: about.trim() || null, gender });
      await refresh();
      flash(t.profileSaved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.profileSaveFailed);
    } finally {
      setSavingProfile(false);
    }
  }

  // ---------- Parol ----------
  async function savePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPass.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    setPassBusy(true);
    setError("");

    try {
      await api.changePassword(oldPass, newPass);
      setOldPass("");
      setNewPass("");
      flash(t.passwordChanged);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.passwordChangeFailed);
    } finally {
      setPassBusy(false);
    }
  }

  // ---------- Kushodani korbar ----------
  async function unblock(userId: string) {
    // Az HAR DU ro-ykhat mebarorem: az backend va az khudamon.
    // Agar yake az onho in korbarro nadosta bosad - be khato
    // meguzarad, faqat digare kor mekunad.
    const results = await Promise.allSettled([
      api.unblockUser(userId),
      unblockLocal(userId),
    ]);

    if (results.every((item) => item.status === "rejected")) {
      setError(t.openFailed);
      return;
    }

    setBlocked((old) => old.filter((item) => item.userId !== userId));
    flash(t.opened);
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-6 md:pt-10">
      {/* ================= SARLAVHA ================= */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[26px] font-bold tracking-tight">{t.settingsTitle}</h1>

        {saved !== "" && (
          <span className="flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--accentA)_14%,transparent)] px-3 py-1.5 text-[12px] font-semibold text-[var(--accentA)]">
            <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
            {saved}
          </span>
        )}
      </div>

      {error !== "" && (
        <p className="mb-4 rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--signal)_10%,transparent)] px-4 py-3 text-[13px] text-[var(--signal)]">
          {error}
        </p>
      )}

      {/* ================= 1. PROFIL ================= */}
      <Section icon={UserRound} title={t.secProfile}>
        {/* Surat */}
        <div className="flex items-center gap-4 px-5 py-5">
          <span className="relative shrink-0">
            <Avatar
              src={me?.image}
              name={me?.fullName ?? me?.userName}
              size={72}
              ring="gradient"
              interactive={false}
            />
            {avatarBusy && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">
              {me?.fullName ?? "—"}
            </p>
            <p className="truncate text-[13px] text-[var(--muted)]">
              @{me?.userName ?? "—"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={avatarBusy}
                className="flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--accentA),var(--accentB))] px-3.5 py-2 text-[12px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />
                {t.newPhoto}
              </button>

              {me?.image && (
                <button
                  type="button"
                  onClick={dropAvatar}
                  disabled={avatarBusy}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3.5 py-2 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--signal)] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  {t.delete}
                </button>
              )}
            </div>

            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const picked = event.target.files?.[0];
                event.target.value = "";
                if (picked) void uploadAvatar(picked);
              }}
            />
          </div>
        </div>

        {/* Nom va email - faqat khondan (backend ivaz kardanro namedihad) */}
        <Row icon={AtSign} label={t.fieldUserName} hint={t.backendLocked}>
          <span className="text-[13px] text-[var(--muted)]">
            @{me?.userName ?? "—"}
          </span>
        </Row>

        <Row icon={Mail} label={t.fieldEmail} hint={t.backendLocked}>
          <span className="truncate text-[13px] text-[var(--muted)]">
            {me?.email ?? "—"}
          </span>
        </Row>

        {/* Dar borai man */}
        <div className="border-t border-[var(--line)] px-5 py-4">
          <label
            htmlFor="about"
            className="mb-2 block text-[13px] font-semibold"
          >
            {t.aboutMe}
          </label>
          <textarea
            id="about"
            rows={3}
            value={about}
            maxLength={200}
            onChange={(event) => setAbout(event.target.value)}
            placeholder={t.aboutPlaceholder}
            className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--panelSoft)] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--accentB)]"
          />
          <p className="mt-1 text-right text-[11px] text-[var(--muted)]">
            {about.length}/200
          </p>

          {/* Jins */}
          <p className="mb-2 mt-3 text-[13px] font-semibold">{t.gender}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 0 as const, label: t.genderMale },
              { value: 1 as const, label: t.genderFemale },
              { value: null, label: t.genderUnset },
            ].map((item) => (
              <button
                key={String(item.value)}
                type="button"
                onClick={() => setGender(item.value)}
                className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  gender === item.value
                    ? "bg-[var(--invBg)] text-[var(--invFg)]"
                    : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-4 flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accentA),var(--accentB))] px-5 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            {savingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserRoundCheck className="h-4 w-4" strokeWidth={2.2} />
            )}
            {t.save}
          </button>
        </div>
      </Section>

      {/* ================= 2. ZOHIR ================= */}
      <Section icon={Palette} title={t.secAppearance}>
        <Row icon={theme === "dark" ? Moon : Sun} label={t.theme}>
          <div className="flex gap-1.5">
            {(
              [
                { value: "dark" as const, label: t.themeDarkShort, Icon: Moon },
                { value: "light" as const, label: t.themeLightShort, Icon: Sun },
              ]
            ).map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => pickTheme(value)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                  theme === value
                    ? "bg-[var(--invBg)] text-[var(--invFg)]"
                    : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={Globe} label={t.language}>
          <div className="flex gap-1.5">
            {LANGS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => pickLanguage(item.code)}
                className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                  lang === item.code
                    ? "bg-[var(--invBg)] text-[var(--invFg)]"
                    : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
                title={item.label}
              >
                {item.short}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* ================= 3. MAKHFIYAT ================= */}
      <Section icon={Lock} title={t.secPrivacy}>
        {loading ? (
          <Skeleton rows={5} />
        ) : (
          PRIVACY.map((item) => (
            <ToggleRow
              key={String(item.key)}
              label={t[item.label]}
              hint={t[item.hint]}
              on={Boolean(settings?.[item.key])}
              onClick={() => flip(item.key)}
              disabled={settings === null}
            />
          ))
        )}
      </Section>

      {/* ================= 4. OGOHINO ================= */}
      <Section icon={Bell} title={t.secNotifications}>
        {loading ? (
          <Skeleton rows={5} />
        ) : (
          NOTIFY.map((item) => (
            <ToggleRow
              key={String(item.key)}
              label={t[item.label]}
              on={Boolean(settings?.[item.key])}
              onClick={() => flip(item.key)}
              disabled={settings === null}
            />
          ))
        )}
      </Section>

      {/* ================= 5. PAROL ================= */}
      <Section icon={Lock} title={t.secPassword}>
        <form onSubmit={savePassword} className="space-y-3 px-5 py-5">
          <input
            type="password"
            value={oldPass}
            onChange={(event) => setOldPass(event.target.value)}
            placeholder={t.oldPassword}
            autoComplete="current-password"
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panelSoft)] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--accentB)]"
          />
          <input
            type="password"
            value={newPass}
            onChange={(event) => setNewPass(event.target.value)}
            placeholder={t.newPassword}
            autoComplete="new-password"
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panelSoft)] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--accentB)]"
          />

          <button
            type="submit"
            disabled={passBusy || oldPass === "" || newPass === ""}
            className="flex items-center gap-2 rounded-full bg-[var(--invBg)] px-5 py-2.5 text-[13px] font-semibold text-[var(--invFg)] transition-transform active:scale-95 disabled:opacity-40"
          >
            {passBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" strokeWidth={2.2} />
            )}
            {t.changeAction}
          </button>
        </form>
      </Section>

      {/* ================= 6. BLOKSHUDA ================= */}
      <Section
        icon={ShieldBan}
        title={`${t.blockedUsers}${allBlocked.length > 0 ? ` (${allBlocked.length})` : ""}`}
      >
        {allBlocked.length === 0 ? (
          <p className="px-5 py-5 text-[13px] text-[var(--muted)]">
            {t.nobodyBlocked}
          </p>
        ) : (
          allBlocked.map((item) => (
            <div
              key={item.userId}
              className="flex items-center gap-3 border-t border-[var(--line)] px-5 py-3.5 first:border-t-0"
            >
              <Avatar src={item.image} name={item.fullName} size={38} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">
                  {item.userName}
                </p>
                <p className="truncate text-[12px] text-[var(--muted)]">
                  {item.fullName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => unblock(item.userId)}
                className="shrink-0 rounded-full border border-[var(--line)] px-3.5 py-2 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
              >
                {t.unblock}
              </button>
            </div>
          ))
        )}
      </Section>

      {/* ================= BAROMADAN ================= */}
      <button
        type="button"
        onClick={logoutEverywhere}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-3xl border border-[var(--line)] px-5 py-4 text-[14px] font-semibold text-[var(--signal)] transition-colors hover:bg-[color-mix(in_srgb,var(--signal)_8%,transparent)]"
      >
        <LogOut className="h-4 w-4" strokeWidth={2.2} />
        {t.logout}
      </button>
    </div>
  );
}

// ------------------------------------------------------------
//  Yak bakhsh (karta bo sarlavha)
// ------------------------------------------------------------
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
        <Icon className="h-4 w-4 text-[var(--accentA)]" strokeWidth={2.2} />
        <h2 className="text-[13px] font-bold uppercase tracking-wide">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// Satri oddi: ikonka + nom + chizi rost
function Row({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-5 py-4 first:border-t-0">
      <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={2} />

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{label}</p>
        {hint !== undefined && (
          <p className="text-[11px] text-[var(--muted)]">{hint}</p>
        )}
      </div>

      {children}
    </div>
  );
}

// Satr bo tugmai khomush/darginron
function ToggleRow({
  label,
  hint,
  on,
  onClick,
  disabled,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-[var(--line)] px-5 py-3.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{label}</p>
        {hint !== undefined && (
          <p className="text-[11px] text-[var(--muted)]">{hint}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        className={`group inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accentA)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-40 ${
          on
            ? "bg-[var(--accentA)]"
            : "bg-[var(--lineStrong)] hover:bg-[color-mix(in_srgb,var(--lineStrong)_70%,var(--muted))]"
        }`}
      >
        <span
          className={`block h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_2px_rgba(16,16,20,0.25)] transition-transform duration-200 ease-out group-active:scale-90 ${
            on ? "translate-x-[20px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 px-5 py-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-6 animate-pulse rounded-lg bg-[var(--lineStrong)]"
          style={{ width: `${60 + ((index * 13) % 35)}%` }}
        />
      ))}
    </div>
  );
}
