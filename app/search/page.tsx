"use client";

// ============================================================
//  app/search/page.tsx  ->  adres: /search
//
//  Kori sahifa (khele sodda):
//    1. korbar dar maidon nom menavisad
//    2. mo 400ms sabr mekunem (ki har harf yak so-rov naravad)
//    3. GET /Search/search-users?Search=...
//    4. ro-ykhati korbaron namoyon meshavad
//    5. ba yak korbar zad -> /getInfoUsers?id=<userId>
//
//  HAMAI korbaron az server meoyand - hech nomi soakhta nest.
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";

import { initials, mediaUrl, searchUsers, type SearchUser } from "./api";
import { getToken } from "./token";
import styles from "./search.module.css";
import { useT } from "@/components/LocaleProvider";

export default function SearchPage() {
  const { t } = useT();
  const [token, setToken] = useState("");
  const [text, setText] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Token faqat dar browser hast
  useEffect(() => {
    queueMicrotask(() => setToken(getToken() ?? ""));
  }, []);

  // ---------- Justuju ----------
  useEffect(() => {
    const clean = text.trim();

    if (clean === "" || token === "") {
      queueMicrotask(() => {
        setUsers([]);
        setError("");
      });
      return;
    }

    queueMicrotask(() => setLoading(true));

    // 400ms sabr - agar korbar boz harf zanad, so-rovi kuhna bekor meshavad
    const timer = setTimeout(() => {
      searchUsers(token, clean)
        .then((list) => {
          setUsers(list);
          setError("");
        })
        .catch((err: Error) => {
          setUsers([]);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    }, 400);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [text, token]);

  return (
    <div className={`${styles.rise} pt-6`}>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">{t.searchTitle}</h1>

      {/* ---------- Maidoni justuju ---------- */}
      <div
        className="flex items-center gap-3 rounded-full px-5 py-3.5"
        style={{ background: "var(--panel)" }}
      >
        <SearchIcon
          className="h-5 w-5 shrink-0"
          strokeWidth={1.8}
          style={{ color: "var(--muted)" }}
        />

        <input
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-transparent text-[15px] outline-none"
          style={{ color: "var(--fg)" }}
        />

        {text !== "" && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label={t.clear}
            style={{ color: "var(--muted)" }}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ---------- Natija ---------- */}
      <div className="mt-6">
        {token === "" ? (
          <Message>
            <Link href="/Auth/login" className="underline">
              {t.searchGuest}
            </Link>
          </Message>
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={styles.skeleton}
                style={{ height: 64, borderRadius: 18 }}
              />
            ))}
          </div>
        ) : error !== "" ? (
          <Message color="var(--signal)">{error}</Message>
        ) : text.trim() === "" ? (
          <Message>{t.searchHint}</Message>
        ) : users.length === 0 ? (
          <Message>{t.searchEmpty}</Message>
        ) : (
          <div className="space-y-1">
            {users.map((user) => (
              <UserRow key={user.userId} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
//  Yak satri korbar. Zadan -> sahifai profili on korbar.
// ------------------------------------------------------------
function UserRow({ user }: { user: SearchUser }) {
  const avatar = mediaUrl(user.image);

  return (
    <Link href={`/getInfoUsers?id=${user.userId}`} className={styles.chatRow}>
      <span className={styles.ring} style={{ height: 52, width: 52 }}>
        <span className={styles.ringInner} style={{ fontSize: 15 }}>
          {avatar !== null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={user.userName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            initials(user.fullName || user.userName)
          )}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">
          {user.userName}
        </span>
        <span
          className="block truncate text-[13px]"
          style={{ color: "var(--muted)" }}
        >
          {user.fullName}
        </span>
      </span>

      {/* Nishonai munosibat - az server meoyad */}
      {user.isFriend ? (
        <Badge text="Dost" />
      ) : user.isFollowing ? (
        <Badge text="Podpiska" />
      ) : user.isFollower ? (
        <Badge text="Ba shumo podpiska" />
      ) : null}
    </Link>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{ background: "var(--panel)", color: "var(--muted)" }}
    >
      {text}
    </span>
  );
}

function Message({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <p
      className="py-16 text-center text-[13px] leading-relaxed"
      style={{ color: color ?? "var(--muted)" }}
    >
      {children}
    </p>
  );
}
