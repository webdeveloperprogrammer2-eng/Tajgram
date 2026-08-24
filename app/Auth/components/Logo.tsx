// ============================================================
//  Logo - wordmark.
//  Nishonai gradient (T) + nomi Tajgram - ayni sabki /profile.
// ============================================================
import styles from "../auth.module.css";

export default function Logo({ size = "small" }: { size?: "small" | "big" }) {
  const box = size === "big" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";
  const textSize = size === "big" ? "text-xl" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`${styles.gradBg} ${box} flex shrink-0 items-center justify-center rounded-[10px] font-black`}
        aria-hidden
      >
        T
      </span>

      <span className={`${styles.gradText} ${textSize} font-black tracking-tight`}>
        Tajgram
      </span>
    </div>
  );
}
