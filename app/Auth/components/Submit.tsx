"use client";

// ============================================================
//  Submit - tugmai asosi (misli photo reference: dark rounded button).
// ============================================================
type Props = {
  label: string;
  loadingLabel: string;
  loading: boolean;
};

export default function Submit({ label, loadingLabel, loading }: Props) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-2xl bg-[var(--brand)] py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-105 hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
