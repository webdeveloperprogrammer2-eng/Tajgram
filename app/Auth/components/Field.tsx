"use client";

// ============================================================
//  Field - yak maidoni forma.
//  Label-i khurdi kalonshuda + khati zeri ki hangomi
//  fokus tilloi meshavad + tugmai "Nishon / Penhon".
//  Baroi parol: agar Caps Lock faol bosad - ogohi medihem.
// ============================================================
import { useState } from "react";

import { useSettings } from "../providers";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;      // qoidai server, masalan "3 to 50 belgi"
  autoFocus?: boolean; // maidoni avval khudash faol shavad
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
}: Props) {
  const { t } = useSettings();

  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const isPassword = type === "password";
  const realType = isPassword && showPassword ? "text" : type;

  // Har tugmai zadashuda - mesanjem, ki Caps Lock faol ast yo ne
  function checkCaps(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isPassword) return;
    setCapsOn(event.getModifierState("CapsLock"));
  }

  return (
    <div>
      <Label
        htmlFor={name}
        style={{ color: focused ? "var(--accentB)" : "var(--muted)" }}
      >
        {label}
      </Label>

      <div className="relative mt-2">
        <Input
          id={name}
          name={name}
          type={realType}
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setCapsOn(false);
          }}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onChange={(event) => onChange(event.target.value)}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200 hover:bg-[var(--panel)]"
            style={{ color: showPassword ? "var(--accentB)" : "var(--muted)" }}
          >
            {showPassword ? t.hide : t.show}
          </button>
        )}
      </div>

      {/* Ogohi: Caps Lock faol ast */}
      {capsOn && (
        <p
          className="mt-2 text-[11px]"
          style={{ color: "var(--danger)" }}
          role="status"
        >
          {t.capsLock}
        </p>
      )}

      {/* Qoidai server - khurd va orom */}
      {hint && !capsOn && (
        <p
          className="mt-2 text-[11px] leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
