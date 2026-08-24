"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import { logoutEverywhere } from "./appTheme";
import { LANGS } from "./appLang";
import { useT } from "./LocaleProvider";
import { useSession } from "./SessionProvider";
import {
  BookmarkIcon,
  CameraIcon,
  CompassIcon,
  CreateIcon,
  HeartIcon,
  HomeIcon,
  MessageIcon,
  MoreIcon,
  ReelsIcon,
  SearchIcon,
  SettingsIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  render: (active: boolean) => React.ReactNode;
  badge?: number;
  mobile?: boolean;
};

export function Sidebar() {
  const pathname = usePathname();
  const { me, unread } = useSession();
  const { t, lang, setLang, theme, toggleTheme } = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  // Закрываем «More» по клику вне меню.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const messages = unread?.message ?? 0;
  const activity = (unread?.like ?? 0) + (unread?.subscribed ?? 0);

  const items: NavItem[] = [
    {
      href: "/",
      label: t.navHome,
      render: (active) => <HomeIcon active={active} />,
      mobile: true,
    },
    {
      href: "/search",
      label: t.navSearch,
      render: () => <SearchIcon />,
      mobile: true,
    },
    {
      href: "/explore",
      label: t.navExplore,
      render: () => <CompassIcon />,
    },
    {
      href: "/reels",
      label: t.navReels,
      render: () => <ReelsIcon />,
      mobile: true,
    },
    {
      href: "/chats",
      label: t.navMessages,
      render: () => <MessageIcon />,
      badge: messages,
      mobile: true,
    },
    {
      href: "/notifications",
      label: t.navNotifications,
      render: (active) => <HeartIcon filled={active} />,
      badge: activity,
    },
    {
      href: "/create",
      label: t.navCreate,
      render: (active) => <CreateIcon active={active} />,
    },
    {
      href: "/profile",
      label: t.navProfile,
      render: () => <Avatar src={me?.image} name={me?.fullName ?? me?.userName} size={24} />,
      mobile: true,
    },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Мобильная шапка */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[60px] items-center justify-between border-b border-[var(--sb-line)] bg-[var(--sb-bg)]/85 px-4 backdrop-blur-md md:hidden">
        <Logo />
        <Link
          href="/notifications"
          aria-label={t.navNotifications}
          className="relative p-2 text-[var(--sb-fg)]"
        >
          <HeartIcon />
          {activity > 0 && <Dot />}
        </Link>
      </header>

      {/* Боковая панель */}
      <nav className="fixed left-0 top-0 z-30 hidden h-dvh w-[245px] flex-col border-r border-[var(--sb-line)] bg-[var(--sb-bg)] px-3 pb-5 pt-[25px] md:flex">
        <div className="px-3 pb-6 pt-2">
          <Logo />
        </div>

        <ul className="flex flex-1 flex-col gap-1">
          {items.map((item, index) => {
            const active = isActive(item.href);
            return (
              <li
                key={item.href}
                style={{ animationDelay: `${index * 45}ms` }}
                className="animate-fade-up relative"
              >
                {active && (
                  <span className="animate-scale-in absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--sb-accent)]" />
                )}
                <Link
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-xl px-3 py-[11px] transition-all duration-200 active:scale-[0.98] ${
                    active
                      ? "bg-[var(--sb-activeBg)] text-[var(--sb-accent)] shadow-[inset_0_0_0_1px_rgba(0,149,246,0.12)]"
                      : "text-[var(--sb-fg)] hover:bg-[var(--sb-hover)]"
                  }`}
                >
                  <span className="relative flex h-6 w-6 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
                    {item.render(active)}
                    {!!item.badge && item.badge > 0 && (
                      <span className="animate-scale-in absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3040] px-1 text-[10px] font-semibold text-white shadow-[0_0_0_2px_#fff]">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[15px] transition-all duration-200 ${
                      active ? "font-semibold" : "group-hover:translate-x-0.5"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}

          <li className="relative mt-1" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              className="group flex w-full items-center gap-4 rounded-xl px-3 py-[11px] text-[var(--sb-fg)] transition-all duration-200 hover:bg-[#f5f5f5] active:scale-[0.98]"
            >
              <span className="flex h-6 w-6 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <MoreIcon />
              </span>
              <span className="text-[15px]">{t.navMore}</span>
            </button>

            {menuOpen && (
              <div className="animate-menu-in absolute bottom-[calc(100%+8px)] left-0 w-[266px] origin-bottom-left overflow-hidden rounded-2xl border border-[var(--sb-line)] bg-[var(--sb-bg)] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.22)]">
                <MenuLink
                  href="/settings"
                  label={t.navSettings}
                  icon={<SettingsIcon size={18} />}
                  onSelect={() => setMenuOpen(false)}
                />
                <MenuLink
                  href="/saved"
                  label={t.navSaved}
                  icon={<BookmarkIcon size={18} />}
                  onSelect={() => setMenuOpen(false)}
                />

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] transition-colors hover:bg-[var(--sb-hover)]"
                >
                  <span className="flex h-[18px] w-[18px] items-center justify-center text-[13px]">
                    {theme === "dark" ? "☀" : "☽"}
                  </span>
                  {theme === "dark" ? t.themeLight : t.themeDark}
                </button>

                {/* Panel-i zabon: intikhob dar hamai sayt kor mekunad */}
                <div className="border-t border-[var(--sb-line)] px-4 py-3">
                  <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {t.navLanguage}
                  </div>
                  <div className="flex gap-1.5">
                    {LANGS.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => setLang(option.code)}
                        title={option.label}
                        aria-pressed={lang === option.code}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
                          lang === option.code
                            ? "bg-[var(--sb-accent)] text-white"
                            : "bg-[var(--sb-hover)] text-[var(--sb-fg)] hover:opacity-80"
                        }`}
                      >
                        {option.short}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logoutEverywhere}
                  className="flex w-full items-center gap-3 border-t border-[var(--sb-line)] px-4 py-3 text-left text-[14px] transition-colors hover:bg-[var(--sb-hover)]"
                >
                  <span className="flex h-[18px] w-[18px] items-center justify-center text-[13px]">
                    {"↪"}
                  </span>
                  {t.logout}
                </button>
              </div>
            )}
          </li>
        </ul>
      </nav>

      {/* Мобильная нижняя навигация */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[50px] items-center justify-around border-t border-[var(--sb-line)] bg-[var(--sb-bg)]/90 backdrop-blur-md md:hidden">
        {items
          .filter((item) => item.mobile)
          .map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`relative flex h-full flex-1 items-center justify-center transition-all duration-200 active:scale-90 ${
                  active ? "scale-110 text-[var(--sb-accent)]" : "text-[var(--sb-fg)]"
                }`}
              >
                {item.render(active)}
                {!!item.badge && item.badge > 0 && <Dot />}
              </Link>
            );
          })}
      </nav>
    </>
  );
}

function MenuLink({
  href,
  label,
  icon,
  onSelect,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="group flex items-center gap-3 px-4 py-3 text-[14px] transition-colors hover:bg-[var(--sb-hover)]"
    >
      {icon}
      {label}
    </Link>
  );
}

function Dot() {
  return (
    <span className="absolute right-[26%] top-[22%] h-2 w-2 rounded-full bg-[#ff3040]" />
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[linear-gradient(45deg,#f9ce34,#ee2a7b_45%,#6228d7)] text-white shadow-[0_4px_12px_-4px_rgba(238,42,123,0.6)] transition-transform duration-500 ease-out group-hover:rotate-[8deg] group-hover:scale-110">
        <CameraIcon size={19} />
      </span>
      <span className="font-logo text-[28px] leading-none text-[var(--sb-fg)] transition-colors duration-300 group-hover:text-[#ee2a7b]">
        Tajgram
      </span>
    </Link>
  );
}
