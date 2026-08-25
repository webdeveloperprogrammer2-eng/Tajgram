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

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { BlockedUser, Settings } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/components/SessionProvider";
import {
  logoutEverywhere,
  readTheme,
  writeTheme,
  type AppTheme,
} from "@/components/appTheme";

// ------------------------------------------------------------
//  Ro-ykhathoi togglho - du guruh
// ------------------------------------------------------------
const PRIVACY: { key: keyof Settings; label: string; hint: string }[] = [
  {
    key: "isPrivateAccount",
    label: "Hisobi pushida",
    hint: "Faqat podpischikho postho-i shumoro mebinand",
  },
  {
    key: "showActivityStatus",
    label: "Holati faoliyat",
    hint: "Digaron mebinand ki shumo onlayn hasted",
  },
  {
    key: "allowComments",
    label: "Izhorho ijozat",
    hint: "Digaron ba postho-i shumo izhor navishta metavonand",
  },
  {
    key: "allowMessages",
    label: "Payomho ijozat",
    hint: "Digaron ba shumo payom firistoda metavonand",
  },
  {
    key: "allowTags",
    label: "Belgizani ijozat",
    hint: "Digaron shumoro dar postho belgi karda metavonand",
  },
];

const NOTIFY: { key: keyof Settings; label: string }[] = [
  { key: "notifyLikes", label: "Bayanho" },
  { key: "notifyComments", label: "Izhorho" },
  { key: "notifyFollows", label: "Podpischikhoi nav" },
  { key: "notifyMessages", label: "Payomho" },
  { key: "emailNotifications", label: "Ba email firistodan" },
];

const LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: "tj", label: "Tojiki", flag: "TJ" },
  { code: "ru", label: "Russkiy", flag: "RU" },
  { code: "en", label: "English", flag: "EN" },
];

export default function SettingsPage() {
  const { me, refresh } = useSession();

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
            cause instanceof Error ? cause.message : "Nastroyka bor nashud"
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

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
        flash("Saql shud");
      } catch {
        setSettings(before);
        setError("Saql nashud");
      }
    },
    [settings, flash]
  );

  // ---------- Yak toggle ----------
  function flip(key: keyof Settings) {
    if (settings === null) return;
    void save({ [key]: !settings[key] } as Partial<Settings>);
  }

  // ---------- Zabon ----------
  function pickLanguage(code: string) {
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
      flash("Surat ivaz shud");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Surat guzoshta nashud");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function dropAvatar() {
    setAvatarBusy(true);
    try {
      await api.deleteAvatar();
      await refresh();
      flash("Surat tark shud");
    } catch {
      setError("Surat tark nashud");
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
      flash("Profil saql shud");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil saql nashud");
    } finally {
      setSavingProfile(false);
    }
  }

  // ---------- Parol ----------
  async function savePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPass.length < 6) {
      setError("Paroli nav kam az 6 harf ast");
      return;
    }

    setPassBusy(true);
    setError("");

    try {
      await api.changePassword(oldPass, newPass);
      setOldPass("");
      setNewPass("");
      flash("Parol ivaz shud");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Parol ivaz nashud");
    } finally {
      setPassBusy(false);
    }
  }

  // ---------- Kushodani korbar ----------
  async function unblock(userId: string) {
    try {
      await api.unblockUser(userId);
      setBlocked((old) => old.filter((item) => item.userId !== userId));
      flash("Kushoda shud");
    } catch {
      setError("Kushoda nashud");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-6 md:pt-10">
      {/* ================= SARLAVHA ================= */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-[26px] font-bold tracking-tight">Nastroyka</h1>

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
      <Section icon={UserRound} title="Profil">
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
                Surati nav
              </button>

              {me?.image && (
                <button
                  type="button"
                  onClick={dropAvatar}
                  disabled={avatarBusy}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3.5 py-2 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--signal)] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Tark kardan
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
        <Row icon={AtSign} label="Nomi korbar" hint="Backend ivazashro namedihad">
          <span className="text-[13px] text-[var(--muted)]">
            @{me?.userName ?? "—"}
          </span>
        </Row>

        <Row icon={Mail} label="Email" hint="Backend ivazashro namedihad">
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
            Dar borai man
          </label>
          <textarea
            id="about"
            rows={3}
            value={about}
            maxLength={200}
            onChange={(event) => setAbout(event.target.value)}
            placeholder="Chand kalima dar borai khud..."
            className="w-full resize-none rounded-2xl border border-[var(--line)] bg-[var(--panelSoft)] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--accentB)]"
          />
          <p className="mt-1 text-right text-[11px] text-[var(--muted)]">
            {about.length}/200
          </p>

          {/* Jins */}
          <p className="mb-2 mt-3 text-[13px] font-semibold">Jins</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 0 as const, label: "Mard" },
              { value: 1 as const, label: "Zan" },
              { value: null, label: "Nagufta" },
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
            Saql kardan
          </button>
        </div>
      </Section>

      {/* ================= 2. ZOHIR ================= */}
      <Section icon={Palette} title="Zohir">
        <Row icon={theme === "dark" ? Moon : Sun} label="Naql">
          <div className="flex gap-1.5">
            {(
              [
                { value: "dark" as const, label: "Torik", Icon: Moon },
                { value: "light" as const, label: "Ravshan", Icon: Sun },
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

        <Row icon={Globe} label="Zabon">
          <div className="flex gap-1.5">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => pickLanguage(item.code)}
                disabled={settings === null}
                className={`rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors disabled:opacity-40 ${
                  settings?.language === item.code
                    ? "bg-[var(--invBg)] text-[var(--invFg)]"
                    : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--fg)]"
                }`}
                title={item.label}
              >
                {item.flag}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* ================= 3. MAKHFIYAT ================= */}
      <Section icon={Lock} title="Makhfiyat">
        {loading ? (
          <Skeleton rows={5} />
        ) : (
          PRIVACY.map((item) => (
            <ToggleRow
              key={String(item.key)}
              label={item.label}
              hint={item.hint}
              on={Boolean(settings?.[item.key])}
              onClick={() => flip(item.key)}
              disabled={settings === null}
            />
          ))
        )}
      </Section>

      {/* ================= 4. OGOHINO ================= */}
      <Section icon={Bell} title="Ogohino">
        {loading ? (
          <Skeleton rows={5} />
        ) : (
          NOTIFY.map((item) => (
            <ToggleRow
              key={String(item.key)}
              label={item.label}
              on={Boolean(settings?.[item.key])}
              onClick={() => flip(item.key)}
              disabled={settings === null}
            />
          ))
        )}
      </Section>

      {/* ================= 5. PAROL ================= */}
      <Section icon={Lock} title="Ivaz kardani parol">
        <form onSubmit={savePassword} className="space-y-3 px-5 py-5">
          <input
            type="password"
            value={oldPass}
            onChange={(event) => setOldPass(event.target.value)}
            placeholder="Paroli kuhna"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panelSoft)] px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--accentB)]"
          />
          <input
            type="password"
            value={newPass}
            onChange={(event) => setNewPass(event.target.value)}
            placeholder="Paroli nav (kam az kam 6 harf)"
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
            Ivaz kardan
          </button>
        </form>
      </Section>

      {/* ================= 6. BLOKSHUDA ================= */}
      <Section
        icon={ShieldBan}
        title={`Korbarhoi blokshuda${blocked.length > 0 ? ` (${blocked.length})` : ""}`}
      >
        {blocked.length === 0 ? (
          <p className="px-5 py-5 text-[13px] text-[var(--muted)]">
            Hech kas blok nashudaast.
          </p>
        ) : (
          blocked.map((item) => (
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
                Kushodan
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
        Baromadan
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
        className={`group relative h-[24px] w-[44px] shrink-0 rounded-full border transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accentA)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-40 ${
          on
            ? "border-transparent bg-[linear-gradient(135deg,var(--accentA),var(--accentB))] shadow-[0_2px_10px_-2px_color-mix(in_srgb,var(--accentA)_65%,transparent)]"
            : "border-[var(--line)] bg-[var(--lineStrong)]"
        }`}
      >
        <span
          className={`absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white transition-[transform,box-shadow] duration-300 ease-out group-active:scale-90 ${
            on
              ? "translate-x-[21px] shadow-[0_1px_3px_rgba(0,0,0,0.28)]"
              : "translate-x-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
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
