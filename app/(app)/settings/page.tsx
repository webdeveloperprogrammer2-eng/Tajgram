"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { useSession } from "@/components/SessionProvider";
import { useT } from "@/components/LocaleProvider";

type ToggleKey = keyof Settings;

const TOGGLES: { key: ToggleKey; dict: keyof ReturnType<typeof useT>["t"] }[] = [
  { key: "isPrivateAccount", dict: "setPrivate" },
  { key: "showActivityStatus", dict: "setActivity" },
  { key: "allowComments", dict: "setComments" },
  { key: "allowMessages", dict: "setMessages" },
  { key: "allowTags", dict: "setTags" },
  { key: "notifyLikes", dict: "setNotifyLikes" },
  { key: "notifyComments", dict: "setNotifyComments" },
  { key: "notifyFollows", dict: "setNotifyFollows" },
  { key: "notifyMessages", dict: "setNotifyMessages" },
  { key: "emailNotifications", dict: "setEmail" },
];

export default function SettingsPage() {
  const { me } = useSession();
  const { t } = useT();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .settings()
      .then((response) => {
        if (alive) setSettings(response.data);
      })
      .catch((cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : t.settingsUnavailable);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = async (key: keyof Settings) => {
    if (!settings) return;
    const next = !settings[key];
    setSettings({ ...settings, [key]: next });
    try {
      await api.updateSettings({ [key]: next });
    } catch {
      setSettings((current) => (current ? { ...current, [key]: !next } : current));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 py-6">
      <h1 className="animate-fade-up mb-5 text-[22px] font-bold">{t.settings}</h1>

      {me && (
        <div className="animate-fade-up mb-6 flex items-center gap-4 rounded-2xl bg-[linear-gradient(120deg,#fafafa,#f5f7ff)] px-4 py-3">
          <Avatar src={me.image} name={me.fullName} size={56} ring="gradient" />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">{me.userName}</div>
            <div className="text-[14px] text-[var(--muted)]">{me.fullName}</div>
            <div className="text-[13px] text-[var(--muted)]">{me.email}</div>
          </div>
        </div>
      )}

      {loading && <p className="text-[14px] text-[var(--muted)]">{t.loading}</p>}
      {error && <p className="text-[14px] text-[#ed4956]">{error}</p>}

      {settings && (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)]">
          {TOGGLES.map((item, index) => {
            const value = Boolean(settings[item.key]);
            const label = t[item.dict];
            return (
              <li
                key={item.key}
                style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
                className="animate-fade-up flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--hover)]"
              >
                <span className="text-[14px]">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  aria-label={label}
                  onClick={() => toggle(item.key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 active:scale-95 ${
                    value ? "bg-[var(--sb-accent)]" : "bg-[#dbdbdb]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--card)] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      value ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
