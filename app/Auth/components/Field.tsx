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
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-[13px] font-semibold tracking-tight opacity-90"
      >
        {label}
      </label>

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
          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm font-medium outline-none transition-all duration-150 focus:border-[var(--fg)] focus:ring-2 focus:ring-[var(--fg)]/10"
          style={{ color: "var(--fg)" }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t.hide : t.show}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        )}
      </div>

      {capsOn && (
        <p className="mt-1 text-[11px] font-medium text-red-500" role="status">
          {t.capsLock}
        </p>
      )}

      {hint && !capsOn && (
        <p className="mt-1 text-[11px] opacity-75" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
