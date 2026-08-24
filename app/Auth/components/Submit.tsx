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
      className="w-full rounded-2xl bg-black py-3.5 text-center text-sm font-semibold text-white shadow-xl transition-all duration-150 hover:bg-zinc-900 hover:shadow-2xl active:scale-[0.99] disabled:opacity-50"
    >
      <span className="flex items-center justify-center gap-2">
        {loading ? loadingLabel : label}
        {loading && (
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:0.4s]" />
          </span>
        )}
      </span>
    </button>
  );
}
