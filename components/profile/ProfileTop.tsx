"use client";

// ============================================================
//  components/profile/ProfileTop.tsx
//
//  Sari sahifai profil - AYNAN monandi instagram.
//
//  CHARO YAK JOI UMUMI?
//  Peshtar DU dizayni tamoman digar bud:
//    /profile          -> kartai shishagin, muqovai mavhum,
//                         halqahoi gardishkunanda, khonahoi
//                         omor bo raqamhoi gradienti
//    /profile/[userId] -> boz yak chizi digar
//  Yane yak "profil" du namud dosht. Instagram YAKTOST.
//  Hozir har du az HAMIN component mekhonand.
//
//  SOKHTORI INSTAGRAM:
//    KOMPYUTER            TELEFON
//    [avatar] nom  tugma  [avatar] [3 raqam]
//             raqamho     nom
//             nom         "dar borai man"
//             bio         [tugmaho - purra]
// ============================================================
import type { ReactNode } from "react";
import { Plus } from "lucide-react";

import { Avatar } from "@/components/Avatar";
import { useT } from "@/components/LocaleProvider";
import { formatCount } from "@/lib/format";

export type ProfileTopProps = {
  userName: string;
  fullName: string;
  about: string | null;
  image: string | null;

  posts: number;
  followers: number;
  following: number;

  /** Tugmaho: "Tahrir" (khud) yo "Obuna" + "Payom" (digaron). */
  actions: ReactNode;

  onFollowers: () => void;
  onFollowing: () => void;

  /** Halqai rangin gird-i avatar - yane story hast. */
  hasStory?: boolean;
  /** Zadan ba avatar (kushodani story yo guzoshtani surati nav). */
  onAvatar?: () => void;

  /**
   * Tugmai "+"-i STORY dar kunji avatar (faqat dar profili KHUDAM).
   * Agar doda nashavad - tugma umuman namoyon nameshavad.
   */
  onAddStory?: () => void;
  /** Story hozir bor karda istodaast -> tugma band. */
  addStoryBusy?: boolean;
};

export function ProfileTop({
  userName,
  fullName,
  about,
  image,
  posts,
  followers,
  following,
  actions,
  onFollowers,
  onFollowing,
  hasStory = false,
  onAvatar,
  onAddStory,
  addStoryBusy = false,
}: ProfileTopProps) {
  const { t } = useT();

  return (
    <header className="animate-fade-up flex flex-col pt-4 md:flex-row md:pt-8">
      {/* ================= AVATAR ================= */}
      {/* Dar instagram sutuni avatar dar kompyuter 290px ast va
          avatar dar MIYONAI on meistad. */}
      <div className="flex shrink-0 items-start md:w-[290px] md:justify-center">
        <AvatarButton
          image={image}
          name={fullName || userName}
          hasStory={hasStory}
          onClick={onAvatar}
          onAddStory={onAddStory}
          addStoryBusy={addStoryBusy}
        />

        {/* --- TELEFON: raqamho dar ROSTI avatar --- */}
        <div className="flex flex-1 items-center justify-around md:hidden">
          <StatBlock value={posts} label={t.posts} />
          <StatBlock value={followers} label={t.followers} onClick={onFollowers} />
          <StatBlock value={following} label={t.followingCount} onClick={onFollowing} />
        </div>
      </div>

      {/* ================= MALUMOT ================= */}
      <section className="min-w-0 flex-1 pt-4 md:pt-0">
        {/* ---------- Nom + tugmaho ---------- */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
          <h1 className="truncate text-[20px] leading-[25px] font-normal">
            {userName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </div>

        {/* ---------- KOMPYUTER: raqamho dar yak satr ---------- */}
        <ul className="mt-5 hidden gap-10 text-[16px] md:flex">
          <StatRow value={posts} label={t.posts} />
          <StatRow value={followers} label={t.followers} onClick={onFollowers} />
          <StatRow value={following} label={t.followingCount} onClick={onFollowing} />
        </ul>

        {/* ---------- Nomi purra va "dar borai man" ---------- */}
        <div className="mt-4 text-[14px] leading-[18px] md:mt-5">
          {fullName.trim() !== "" && <p className="font-semibold">{fullName}</p>}

          {about !== null && about.trim() !== "" && (
            <p className="mt-1 whitespace-pre-line">{about}</p>
          )}
        </div>
      </section>
    </header>
  );
}

// ------------------------------------------------------------
//  Avatar. Agar zadan mumkin bosad - <button>, vagarna <span>.
//  Halqai rangin faqat on vaqt ki story hast (monandi instagram).
//
//  Tugmai "+"-i story dar KUNJI POYONI-ROSTI avatar meistad -
//  aynan monandi instagram. DIQQAT: on BERUNI tugmai avatar ast,
//  chunki <button> daruni <button> dar HTML mumkin nest (React
//  ogohi medihad va zadan durust kor namekunad).
// ------------------------------------------------------------
function AvatarButton({
  image,
  name,
  hasStory,
  onClick,
  onAddStory,
  addStoryBusy = false,
}: {
  image: string | null;
  name: string;
  hasStory: boolean;
  onClick?: () => void;
  onAddStory?: () => void;
  addStoryBusy?: boolean;
}) {
  const { t } = useT();
  const storyLabel = t.newStory;

  const picture = (
    <>
      {/* Andozahoi instagram: 150px dar kompyuter, 77px dar telefon */}
      <Avatar
        src={image}
        name={name}
        size={150}
        ring="none"
        interactive={false}
        className="hidden rounded-full md:inline-flex"
      />
      <Avatar
        src={image}
        name={name}
        size={77}
        ring="none"
        interactive={false}
        className="rounded-full md:hidden"
      />
    </>
  );

  // Halqa gird-i avatar:
  //   story NEST -> halqai YAKRANG (siyoh dar naqli ravshan,
  //                 safed dar torik - var(--fg) hamesha namoyon)
  //   story HAST -> gradienti instagram
  // Andozahoi har du yak khel - faqat rang farq mekunad.
  const ring = hasStory
    ? "bg-[linear-gradient(45deg,#f9ce34,#ee2a7b_45%,#6228d7)] p-[3px]"
    : "bg-[var(--fg)] p-[3px]";

  const inner = (
    <span className="block rounded-full border-[3px] border-[var(--bg)]">
      {picture}
    </span>
  );

  const circle = onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Surati ${name}`}
      className={`block rounded-full transition-transform duration-200 active:scale-95 ${ring}`}
    >
      {inner}
    </button>
  ) : (
    <span className={`block rounded-full ${ring}`}>{inner}</span>
  );

  // Be tugmai "+" - hech chizi zieda lozim nest
  if (onAddStory === undefined) {
    return <span className="mr-7 inline-block md:mr-0">{circle}</span>;
  }

  return (
    <span className="relative mr-7 inline-block md:mr-0">
      {circle}

      {/* "+"-i story: kabudi instagram, bo halqai fon gird-i khud,
          to ki roi surat aniq namoyon boshad. */}
      <button
        type="button"
        onClick={onAddStory}
        disabled={addStoryBusy}
        title={storyLabel}
        aria-label={storyLabel}
        className="absolute right-0 bottom-0 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] border-[var(--bg)] bg-[#0095f6] text-white shadow-sm transition-all duration-200 hover:bg-[#1877f2] active:scale-90 disabled:opacity-60 md:right-1 md:bottom-1 md:h-9 md:w-9"
      >
        <Plus className="h-3.5 w-3.5 md:h-5 md:w-5" strokeWidth={3} />
      </button>
    </span>
  );
}

// ------------------------------------------------------------
//  Raqam dar KOMPYUTER: "12 post" - dar yak satr.
// ------------------------------------------------------------
function StatRow({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  const inside = (
    <>
      <b className="font-semibold tabular-nums">{formatCount(value)}</b>{" "}
      <span className="text-[var(--muted)]">{label}</span>
    </>
  );

  return (
    <li>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="transition-opacity duration-150 hover:opacity-60"
        >
          {inside}
        </button>
      ) : (
        <span>{inside}</span>
      )}
    </li>
  );
}

// ------------------------------------------------------------
//  Raqam dar TELEFON: raqam dar bolo, nom dar poyon.
// ------------------------------------------------------------
function StatBlock({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  const inside = (
    <>
      <span className="block text-[16px] leading-tight font-semibold tabular-nums">
        {formatCount(value)}
      </span>
      <span className="block text-[13px] text-[var(--muted)]">{label}</span>
    </>
  );

  if (!onClick) return <div className="px-2 text-center">{inside}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 text-center transition-opacity duration-150 active:opacity-60"
    >
      {inside}
    </button>
  );
}

// ------------------------------------------------------------
//  Tugmai sabki instagram: khokistari, kunjhoi 8px, balandi 32px.
//  primary = kabudi instagram ("Obuna").
// ------------------------------------------------------------
export function ProfileButton({
  children,
  onClick,
  href,
  primary = false,
  disabled = false,
  title,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const look = primary
    ? "bg-[#0095f6] text-white hover:bg-[#1877f2]"
    : "bg-[var(--panel)] text-[var(--fg)] hover:brightness-95";

  const all = `inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-4 text-[14px] font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 ${look} ${className}`;

  if (href !== undefined) {
    return (
      <a href={href} title={title} className={all}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={all}
    >
      {children}
    </button>
  );
}
