"use client";

// ============================================================
//  Logo - wordmark.
//  Instagram camera icon + Instagram gradient "Tajgram" text.
// ============================================================
export default function Logo({ size = "small" }: { size?: "small" | "big" }) {
  const box = size === "big" ? "h-9 w-9 p-1.5" : "h-7 w-7 p-1";
  const iconSize = size === "big" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "big" ? "text-xl" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${box} flex shrink-0 items-center justify-center rounded-[10px] text-white shadow-sm`}
        style={{ background: "var(--accentA)" }}
        aria-hidden
      >
        <svg
          className={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>

      <span className={`${textSize} font-bold tracking-tight select-none`}>
        Tajgram
      </span>
    </div>
  );
}
