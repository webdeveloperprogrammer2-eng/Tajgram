"use client";

// ============================================================
//  components/profile/ProfileTabs.tsx
//
//  Tabhoi zeri profil - AYNAN monandi instagram:
//    KOMPYUTER: khatti borik dar bolo, nomho bo harfhoi
//               kalon, tabi faol khatti siyoh dar BOLO dorad.
//    TELEFON:   faqat nishonaho (ikonkaho), be matn.
//
//  Peshtar du joi digar du sabki digar doshtand:
//  yake khatti gradienti LAGZANDA dar POYON (ProfileView),
//  digare ramkai gird bo harakat (ContentTabs). Hozir YAK KHEL.
// ============================================================
import type { ReactNode } from "react";

export type ProfileTab = {
  id: string;
  label: string;
  icon: ReactNode;
};

export function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: ProfileTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav
      className="mt-10 flex justify-center border-t md:mt-11 md:gap-15"
      style={{ borderColor: "var(--line)" }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const on = tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.id)}
            // "-mt-px" - to khatti boloi tabi faol AYNAN roi
            // khatti umumi shinad (hamon hiylai instagram).
            className={`-mt-px flex flex-1 items-center justify-center gap-1.5 border-t-[1px] py-3 text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors duration-200 md:flex-none md:py-4 ${
              on
                ? "border-[var(--fg)] text-[var(--fg)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            <span className="flex h-3 w-3 items-center justify-center md:h-3 md:w-3">
              {tab.icon}
            </span>
            {/* Dar telefon instagram nomro namenamoyad - faqat nishona */}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ------------------------------------------------------------
//  Turi 3-sutuna - hamon andozahoi instagram:
//  dar telefon farqi 2px, dar kompyuter 4px, kunjho GIRD NEST.
// ------------------------------------------------------------
export function ProfileGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-[2px] py-[2px] md:gap-1 md:py-1">
      {children}
    </div>
  );
}

// ------------------------------------------------------------
//  Holati kholi - monandi instagram: doirai ramkador + matn.
// ------------------------------------------------------------
export function ProfileEmpty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-3 py-16 text-center md:py-24">
      <span
        className="flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 text-[var(--fg)]"
        style={{ borderColor: "var(--fg)" }}
      >
        {icon}
      </span>

      <h2 className="mt-2 text-[24px] font-extrabold tracking-tight md:text-[30px]">
        {title}
      </h2>

      {text !== undefined && (
        <p className="max-w-[320px] text-[14px] text-[var(--muted)]">{text}</p>
      )}

      {action}
    </div>
  );
}
