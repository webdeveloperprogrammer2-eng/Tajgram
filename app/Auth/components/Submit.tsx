"use client";

// ============================================================
//  Submit - tugmai asosi-i forma.
//  Vaqte firistoda istodaem - se nuqta mejahand.
// ============================================================
import { Button } from "../ui/button";
import styles from "../auth.module.css";

type Props = {
  label: string;
  loadingLabel: string;
  loading: boolean;
};

export default function Submit({ label, loadingLabel, loading }: Props) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={loading}
      className={`${styles.sheen} w-full`}
    >
      <span className="relative z-10 flex items-center gap-3">
        {loading ? loadingLabel : label}

        {loading ? (
          <span className={`${styles.dots} flex items-center gap-1`}>
            {[0, 1, 2].map((i) => (
              <i key={i} style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </span>
    </Button>
  );
}
