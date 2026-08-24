"use client";

// ============================================================
//  BrandMark - dar boloi swiper.
//  Ikonkai Instagram dar shakli 3D (do taraf dorad va mecharkhad)
//  + nom "Tajgram" ki harf ba harf bolo meoyad
//  + 2 kalimai kalon.
// ============================================================
import { useSettings } from "../providers";
import styles from "../auth.module.css";

const NAME = "Tajgram";

function InstagramIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function BrandMark() {
  const { t } = useSettings();

  return (
    <div>
      <div className="flex items-center gap-4">
        {/* ---------- Ikonkai 3D ---------- */}
        <div
          className={styles.logoEnter}
          style={{ perspective: "600px" }}
          aria-hidden
        >
          <div className={`${styles.logo3d} relative h-12 w-12`}>
            {/* Tarafi PESH */}
            <span
              className="absolute inset-0 grid place-items-center rounded-[14px] border-2 border-white/85 text-white"
              style={{ backfaceVisibility: "hidden" }}
            >
              <InstagramIcon className="h-6 w-6" />
            </span>

            {/* Tarafi AQIB (vaqte mecharkhad namoyon meshavad) */}
            <span
              className="absolute inset-0 grid place-items-center rounded-[14px] text-white"
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                background: "linear-gradient(135deg, var(--accentA), var(--accentB))",
              }}
            >
              <InstagramIcon className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* ---------- Nom: harf ba harf ---------- */}
        <p
          className="text-2xl font-black tracking-tight text-white"
          style={{ perspective: "500px" }}
        >
          {NAME.split("").map((char, i) => (
            <span
              key={`${char}-${i}`}
              className={styles.letter}
              style={{ animationDelay: `${0.35 + i * 0.06}s` }}
            >
              {char}
            </span>
          ))}
        </p>
      </div>

      {/* ---------- 2 kalimai kalon ---------- */}
      <h1
        className={`${styles.display} mt-8 text-white`}
        style={{ fontSize: "clamp(2.4rem, 4.4vw, 4rem)" }}
      >
        <span
          className={`${styles.fadeUp} block`}
          style={{ animationDelay: "0.55s" }}
        >
          {t.heroLine1}
        </span>
        <span
          className={`${styles.fadeUp} ${styles.accentWord} block`}
          style={{ animationDelay: "0.7s" }}
        >
          {t.heroLine2}
        </span>
      </h1>

      {/* Khati tilloi */}
      <span
        className={`${styles.ruleIn} ${styles.gradBg} mt-7 block h-[3px] w-24 rounded-full`}
        aria-hidden
      />
    </div>
  );
}
