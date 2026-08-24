"use client";

// ============================================================
//  Do tab: Daromadan | Sabti nom
//  Shakli "pill": bloki lagzandai gradient zeri tabi faol meravad.
// ============================================================
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSettings } from "../providers";
import styles from "../auth.module.css";

export default function RouteTabs() {
  const pathname = usePathname();
  const { t } = useSettings();

  const tabs = [
    { href: "/Auth/login", label: t.tabLogin },
    { href: "/Auth/register", label: t.tabRegister },
  ];

  // Kadom tab faol ast: 0 yo 1
  const activeIndex = pathname?.toLowerCase() === "/auth/register" ? 1 : 0;

  return (
    <nav
      className="relative inline-flex rounded-full p-1"
      style={{ background: "var(--panel)" }}
    >
      {/* Bloki lagzanda - oram az yak tab ba digare meravad */}
      <span
        className={`${styles.gradBg} absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-500`}
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
        aria-hidden
      />

      {tabs.map((tab, i) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="relative z-10 w-32 py-2 text-center text-[13px] font-semibold transition-colors duration-300"
          style={{
            color: i === activeIndex ? "#ffffff" : "var(--muted)",
          }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
