"use client";

// ============================================================
//  Field - maidoni forma bo dizayni frosted glass (misli rasmi user).
//  Label-i bolo + input-i gird + nishonai eye baroi parol.
// ============================================================
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useSettings } from "../providers";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
  autoFocus?: boolean;
  placeholder?: string;
  error?: string;
};

export default function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  hint,
  autoFocus,
  placeholder,
  error,
}: Props) {
  const { t } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const isPassword = type === "password";
  const realType = isPassword && showPassword ? "text" : type;

  function checkCaps(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isPassword) return;
    setCapsOn(event.getModifierState("CapsLock"));
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label
          htmlFor={name}
          className="block text-[13px] font-bold tracking-tight opacity-90 text-[var(--fg)]"
        >
          {label}
        </label>
      </div>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={realType}
          value={value}
          placeholder={placeholder || label}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border bg-[var(--panel)] px-4 py-3.5 text-sm font-medium outline-none transition-all duration-200 ${
            error
              ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-4 focus:ring-[var(--dangerSoft)]"
              : "border-[var(--line)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--goldSoft)]"
          }`}
          style={{ color: "var(--fg)" }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t.hide : t.show}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panelSoft)] transition-all duration-150"
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" strokeWidth={1.8} />
            ) : (
              <Eye className="h-4.5 w-4.5" strokeWidth={1.8} />
            )}
          </button>
        )}
      </div>

      {capsOn && (
        <p className="px-1 text-[11px] font-bold text-[var(--danger)]" role="status">
          ⚠️ {t.capsLock}
        </p>
      )}

      {error && !capsOn && (
        <p className="px-1 text-[11px] font-bold text-[var(--danger)] animate-fade-in" role="status">
          {error}
        </p>
      )}

      {hint && !error && !capsOn && (
        <p className="px-1 text-[11px] font-medium opacity-75" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
