"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import { useSession } from "./SessionProvider";
import {
  BookmarkIcon,
  CameraIcon,
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
      label: "Home",
      render: (active) => <HomeIcon active={active} />,
      mobile: true,
    },
    {
      href: "/search",
      label: "Search",
      render: () => <SearchIcon />,
      mobile: true,
    },
    {
      href: "/reels",
      label: "Reels",
      render: () => <ReelsIcon />,
      mobile: true,
    },
    {
      href: "/messages",
      label: "Messages",
      render: () => <MessageIcon />,
      badge: messages,
      mobile: true,
    },
    {
      href: "/notifications",
      label: "Notifications",
      render: (active) => <HeartIcon filled={active} />,
      badge: activity,
    },
    {
      href: "/create",
      label: "Create",
      render: (active) => <CreateIcon active={active} />,
    },
    {
      href: "/profile",
      label: "Profile",
      render: () => <Avatar src={me?.image} name={me?.fullName ?? me?.userName} size={24} />,
      mobile: true,
    },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Мобильная шапка */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#efefef] bg-white/85 px-4 backdrop-blur-md md:hidden">
        <Logo />
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative p-2 text-[#262626]"
        >
          <HeartIcon />
          {activity > 0 && <Dot />}
        </Link>
      </header>

      {/* Боковая панель */}
      <nav className="fixed left-0 top-0 z-30 hidden h-dvh w-[245px] flex-col border-r border-[#efefef] bg-white px-3 pb-5 pt-[25px] md:flex">
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
                  <span className="animate-scale-in absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[#0095f6]" />
                )}
                <Link
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-xl px-3 py-[11px] transition-all duration-200 active:scale-[0.98] ${
                    active
                      ? "bg-[linear-gradient(90deg,#e8f2fd,#f7fbff)] text-[#0095f6] shadow-[inset_0_0_0_1px_rgba(0,149,246,0.12)]"
                      : "text-[#262626] hover:bg-[#f5f5f5]"
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
              className="group flex w-full items-center gap-4 rounded-xl px-3 py-[11px] text-[#262626] transition-all duration-200 hover:bg-[#f5f5f5] active:scale-[0.98]"
            >
              <span className="flex h-6 w-6 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <MoreIcon />
              </span>
              <span className="text-[15px]">More</span>
            </button>

            {menuOpen && (
              <div className="animate-menu-in absolute bottom-[calc(100%+8px)] left-0 w-[266px] origin-bottom-left overflow-hidden rounded-2xl border border-[#efefef] bg-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.22)]">
                <MenuLink
                  href="/settings"
                  label="Settings"
                  icon={<SettingsIcon size={18} />}
                  onSelect={() => setMenuOpen(false)}
                />
                <MenuLink
                  href="/saved"
                  label="Saved"
                  icon={<BookmarkIcon size={18} />}
                  onSelect={() => setMenuOpen(false)}
                />
              </div>
            )}
          </li>
        </ul>
      </nav>

      {/* Мобильная нижняя навигация */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[50px] items-center justify-around border-t border-[#efefef] bg-white/90 backdrop-blur-md md:hidden">
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
                  active ? "scale-110 text-[#0095f6]" : "text-[#262626]"
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
      className="group flex items-center gap-3 px-4 py-3 text-[14px] transition-colors hover:bg-[#fafafa]"
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
      <span className="font-logo bg-[linear-gradient(90deg,#262626,#262626)] bg-clip-text text-[28px] leading-none text-[#262626] transition-colors duration-300 group-hover:text-[#ee2a7b]">
        Tajgram
      </span>
    </Link>
  );
}
