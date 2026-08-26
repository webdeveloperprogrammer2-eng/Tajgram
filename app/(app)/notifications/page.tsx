"use client";

// ============================================================
//  /notifications - Ogohinomaho.
//
//  DU KHATO BUD:
//    1) Satr ZADAN NAMESHUD. Vaqte kase ba man payom menavisht,
//       ogohinoma "iso sent you a message" faqat matn bud -
//       zadanash HECH KOR namekard. Odam mebayad khudash ba
//       /chats meraft va on jo hamon odamro meyoft.
//       Hozir: zadan ba satr -> RO-YKHAT ba HAMON suhbat.
//       Zadan ba NOM yo SURAT -> profili hamon odam
//       (baroi hamin dar on du <Link> stopPropagation hast).
//
//    2) Ro-ykhat FAQAT yak bor hangomi kushodan bor meshud.
//       Payomi nav dar sahifai kushoda paydo NAMESHUD to
//       navsozii dasti. Hozir ba "chat:message"-i WebSocket
//       gush mekunem -> ogohinoma FAVRAN meoyad.
//
//  DIZAYN (nav):
//    - sarlavhai chaspon + shumorai "nav"
//    - filtrho: Hama / Obunaho / Pisandho / Payomho
//    - guruhbandi az ruyi vaqt: Imruz / Hafta / Peshtar
//    - har satr - kort bo nishonai navʼ dar kunji avatar
//    - bori zinavi: poyoni ro-ykhat -> qismi navbati
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import { shortTimeAgo } from "@/lib/format";
import type { AppNotification, NotificationType } from "@/lib/types";
import { useCall } from "@/app/chats/call/CallProvider";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { useT } from "@/components/LocaleProvider";
import { useSession } from "@/components/SessionProvider";
import { HeartIcon, MessageIcon, UserPlusIcon } from "@/components/icons";

type Filter = "all" | NotificationType;

/** Dar yak qadam chand ogohinomai nav girifta meshavad. */
const PAGE_SIZE = 20;

/** Ranghoi nishonai navʼi ogohinoma - yak joi yagona. */
const BADGE: Record<NotificationType, { bg: string; glow: string }> = {
  like: {
    bg: "linear-gradient(135deg,#ff2e74,#ff7a59)",
    glow: "0 4px 12px -4px rgba(255,46,116,0.75)",
  },
  subscribed: {
    bg: "linear-gradient(135deg,#7a2bff,#c05bff)",
    glow: "0 4px 12px -4px rgba(122,43,255,0.75)",
  },
  message: {
    bg: "linear-gradient(135deg,#2f8bff,#22c8dc)",
    glow: "0 4px 12px -4px rgba(47,139,255,0.75)",
  },
};

function TypeBadge({ type }: { type: NotificationType }) {
  const style = BADGE[type] ?? BADGE.like;
  return (
    <span
      className="absolute -right-0.5 -bottom-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-white ring-2 ring-[var(--bg)] transition-transform duration-300 group-hover:scale-110"
      style={{ background: style.bg, boxShadow: style.glow }}
    >
      {type === "like" && <HeartIcon size={12} filled />}
      {type === "subscribed" && <UserPlusIcon size={12} />}
      {type === "message" && <MessageIcon size={12} />}
    </span>
  );
}

/** Guruhbandi az ruyi vaqt: imruz / hafta / peshtar. */
type Bucket = "today" | "week" | "earlier";

function bucketOf(iso: string): Bucket {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "earlier";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (then >= startOfToday.getTime()) return "today";
  if (then >= startOfToday.getTime() - 6 * 86_400_000) return "week";
  return "earlier";
}

export default function NotificationsPage() {
  const { refresh } = useSession();
  const { onChatEvent } = useCall();
  const { t } = useT();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  // ---------- Bori zinavi ----------
  // Server ro-ykhatro doim az sari nav mediihad (payomi nav dar boло
  // meoyad), baroi hamin "sahifai navbati" NE - balki HAJMI ro-ykhat
  // meafzoyad. Bе in ba'di har navsozi satrho takror meshudand.
  const pages = useRef(1);
  const busy = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // `silent` - navsozii zinda: skeleton az nav namoyon nameshavad
  const load = useCallback(
    async (silent = false) => {
      try {
        const size = PAGE_SIZE * pages.current;
        const response = await api.notifications({ page: 1, pageSize: size });
        const list = response.data ?? [];
        setItems(list);
        setHasMore(list.length >= size);
        // Ekran kushoda ast - navkhonda-nashudaho khonda hisob meshavand.
        await api.readAllNotifications().catch(() => {});
        await refresh();
      } catch {
        if (!silent) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // ---------- FAVRAN: payomi nav az WebSocket ----------
  // CallProvider dar app/layout.tsx ast va payvasti /realtime-ro
  // dar HAMAI sahifaho nigoh medorad -> in jo faqat gush mekunem.
  useEffect(() => onChatEvent(() => void load(true)), [onChatEvent, load]);

  // Ogohinomahoi "like" va "obuna" az WebSocket namebaroyand -
  // baroi onho yak sanjishi sabuk har 20 soniya.
  useEffect(() => {
    const timer = setInterval(() => void load(true), 20_000);
    return () => clearInterval(timer);
  }, [load]);

  /** Qismi navbati - vaqte poyoni ro-ykhat nazdik meshavad. */
  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoadingMore(true);

    const next = pages.current + 1;
    try {
      const size = PAGE_SIZE * next;
      const response = await api.notifications({ page: 1, pageSize: size });
      const list = response.data ?? [];
      pages.current = next;
      setItems(list);
      setHasMore(list.length >= size);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      busy.current = false;
    }
  }, [hasMore]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  /** Ogohinomai "payom" -> ba HAMON suhbat. */
  function openChat(item: AppNotification) {
    if (item.chatId !== null && item.chatId > 0) {
      router.push(`/chats?chatId=${item.chatId}`);
      return;
    }
    // Raqami suhbat nayomad -> /chats khudash az ro-yi odam meyobad
    // yo suhbati nav mesozad.
    router.push(`/chats?userId=${encodeURIComponent(item.userId)}`);
  }

  const counts = useMemo(
    () => ({
      all: items.length,
      subscribed: items.filter((n) => n.type === "subscribed").length,
      like: items.filter((n) => n.type === "like").length,
      message: items.filter((n) => n.type === "message").length,
    }),
    [items],
  );

  const unread = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((n) => n.type === filter)),
    [items, filter],
  );

  // Guruhho tartibi khudro nigoh medorand: imruz -> hafta -> peshtar.
  const groups = useMemo(() => {
    const map: Record<Bucket, AppNotification[]> = { today: [], week: [], earlier: [] };
    for (const item of visible) map[bucketOf(item.createdAt)].push(item);
    return (
      [
        ["today", t.notifToday, map.today],
        ["week", t.notifThisWeek, map.week],
        ["earlier", t.notifEarlier, map.earlier],
      ] as const
    ).filter(([, , list]) => list.length > 0);
  }, [visible, t]);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t.notifAll, count: counts.all },
    { key: "subscribed", label: t.notifFollows, count: counts.subscribed },
    { key: "like", label: t.notifLikes, count: counts.like },
    { key: "message", label: t.notifMessages, count: counts.message },
  ];

  let animationIndex = 0;

  return (
    <div className="mx-auto w-full max-w-[640px] px-3 pb-16 sm:px-4">
      {/* ---------- Sarlavha + filtrho (chaspon) ---------- */}
      <header className="sticky top-[60px] z-20 -mx-3 mb-1 bg-[var(--glass)] px-3 pt-5 pb-3 backdrop-blur-xl sm:-mx-4 sm:px-4 md:top-0">
        <div className="animate-fade-up flex items-center gap-3">
          <h1 className="text-[26px] leading-none font-bold tracking-tight">
            {t.notifications}
          </h1>

          {unread > 0 && (
            <span
              className="animate-pop rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg,var(--accentA),var(--accentB))",
                boxShadow: "0 4px 14px -6px rgba(255,46,116,0.9)",
              }}
            >
              {unread} {t.notifNew}
            </span>
          )}
        </div>

        <nav className="animate-fade-up mt-3.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  active
                    ? "bg-[var(--invBg)] text-[var(--invFg)] shadow-[var(--shadowSoft)]"
                    : "bg-[var(--panel)] text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--fg)]"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-bold ${
                      active
                        ? "bg-[color-mix(in_srgb,var(--invFg)_22%,transparent)]"
                        : "bg-[var(--bg)] text-[var(--muted)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ---------- Bor shuda istodaast ---------- */}
      {loading && (
        <ul className="space-y-1.5 pt-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <div className="skeleton h-[52px] w-[52px] shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 rounded" style={{ width: `${70 - index * 6}%` }} />
                <div className="skeleton h-2.5 w-16 rounded" />
              </div>
              <div className="skeleton h-9 w-[86px] shrink-0 rounded-xl" />
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Tamoman kholi ---------- */}
      {!loading && items.length === 0 && (
        <div className="animate-fade-up flex flex-col items-center gap-4 py-20 text-center">
          <span className="relative flex h-24 w-24 items-center justify-center">
            <span
              className="animate-halo absolute inset-0 rounded-full opacity-25 blur-xl"
              style={{ background: "linear-gradient(135deg,var(--accentA),var(--accentB))" }}
            />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--accentA)]">
              <HeartIcon size={38} />
            </span>
          </span>
          <div className="space-y-1">
            <p className="text-[16px] font-semibold">{t.noActivity}</p>
            <p className="max-w-[260px] text-[13px] text-[var(--muted)]">{t.notifEmptyHint}</p>
          </div>
        </div>
      )}

      {/* ---------- Filtr chize nayoft ---------- */}
      {!loading && items.length > 0 && visible.length === 0 && (
        <p className="animate-fade-up py-16 text-center text-[14px] text-[var(--muted)]">
          {t.notifTabEmpty}
        </p>
      )}

      {/* ---------- Ro-ykhat ---------- */}
      {groups.map(([bucket, title, list]) => (
        <section key={bucket} className="pt-3">
          <h2 className="animate-fade-up mb-1.5 px-3 text-[11px] font-bold tracking-[0.09em] text-[var(--muted)] uppercase">
            {title}
          </h2>

          <ul className="space-y-1">
            {list.map((item) => {
              const preview = mediaUrl(item.previewImage);
              const isMessage = item.type === "message";
              const delay = Math.min(animationIndex++, 12) * 45;

              return (
                <li
                  key={item.id}
                  style={{ animationDelay: `${delay}ms` }}
                  // Faqat ogohinomai "payom" ba suhbat mebarad -
                  // baroi "like"/"obuna" suhbate nest ki kushoda shavad.
                  role={isMessage ? "button" : undefined}
                  tabIndex={isMessage ? 0 : undefined}
                  onClick={isMessage ? () => openChat(item) : undefined}
                  onKeyDown={
                    isMessage
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openChat(item);
                          }
                        }
                      : undefined
                  }
                  className={`animate-fade-up group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-3 transition-all duration-300 hover:-translate-y-px hover:border-[var(--line)] hover:bg-[var(--panelSoft)] hover:shadow-[var(--shadowSoft)] ${
                    isMessage ? "cursor-pointer" : ""
                  } ${
                    item.isRead
                      ? "border-transparent"
                      : "border-[color-mix(in_srgb,var(--accentA)_18%,transparent)] bg-[color-mix(in_srgb,var(--accentA)_7%,transparent)]"
                  }`}
                >
                  {!item.isRead && (
                    <span
                      className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                      style={{
                        background: "linear-gradient(180deg,var(--accentA),var(--accentB))",
                      }}
                    />
                  )}

                  {/* Surat va NOM -> profil. stopPropagation, vagarna
                      zadan ba nom ham ba suhbat mebarad. */}
                  <Link
                    href={`/profile/${item.userId}`}
                    onClick={(event) => event.stopPropagation()}
                    className="relative shrink-0"
                  >
                    <Avatar src={item.userImage} name={item.fullName} size={52} />
                    <TypeBadge type={item.type} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-[19px] text-[var(--fg)]">
                      <Link
                        href={`/profile/${item.userId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-semibold hover:underline"
                      >
                        {item.userName}
                      </Link>{" "}
                      <span className="text-[var(--muted)]">{item.text}</span>
                      {item.preview ? (
                        <span className="text-[var(--fg)]"> «{item.preview}»</span>
                      ) : null}
                    </p>

                    <p className="mt-0.5 text-[12px] text-[var(--muted)]">
                      {shortTimeAgo(item.createdAt)}
                    </p>
                  </div>

                  {item.type === "subscribed" ? (
                    <span className="shrink-0" onClick={(event) => event.stopPropagation()}>
                      <FollowButton
                        userId={item.userId}
                        initialFollowing={item.isFollowing}
                        variant="solid"
                      />
                    </span>
                  ) : (
                    preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl border border-[var(--line)] object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                      />
                    )
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* ---------- Poyoni ro-ykhat: qismi navbati ---------- */}
      {!loading && items.length > 0 && hasMore && (
        <div ref={sentinel} className="flex justify-center py-6">
          <span
            className={`h-6 w-6 rounded-full border-2 border-[var(--line)] border-t-[var(--accentA)] ${
              loadingMore ? "animate-spin" : "opacity-0"
            }`}
          />
        </div>
      )}
    </div>
  );
}
