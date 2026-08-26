"use client";

// ============================================================
//  EditProfileModal - tahriri profil, monandi instagram.
//
//  ============================================================
//  IN JO DU KHATO BUD:
//
//  1) In modal UMUMAN dar hech joi sayt istifoda nameshud -
//     ya'ne korbar "dar borai man" va jinsro ivaz karda
//     NAMETAVONIST. Hozir tugmai "Tahriri profil" onro
//     mekushoyad.
//
//  2) SURATI profil in jo nabud - onro faqat dar /settings
//     ivaz kardan mumkin bud. Dar instagram surat AYNAN dar
//     hamin oyna ivaz meshavad. Hozir hamin tavr ast:
//     PUT /UserProfile/update-user-image-profile
//     DELETE /UserProfile/delete-user-image-profile
//  ============================================================
//
//  DIQQAT: server nom, userName va email-ro ivaz kardan
//  NAMEDIHAD (az swagger: UpdateUserProfileDto faqat
//  "about" va "gender" dorad).
// ============================================================
import { useEffect, useRef, useState } from "react";

import {
  deleteMyAvatar,
  errorText,
  mediaUrl,
  updateMyAvatar,
  updateMyProfile,
} from "../api";
import { toJpegFile } from "../toJpeg";
import { initials } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useT } from "@/components/LocaleProvider";

const ABOUT_LIMIT = 300;

export default function EditProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { t } = useT();
  const { profile, token, setProfile, reload } = useProfile();

  const [about, setAbout] = useState("");
  const [gender, setGender] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");

  const fileInput = useRef<HTMLInputElement>(null);

  // Har bor ki modal kushoda meshavad - qimathoi HOZIRAI serverro meguzorem
  useEffect(() => {
    if (!open || profile === null) return;

    queueMicrotask(() => {
      setAbout(profile.about ?? "");
      setGender(profile.gender);
      setError("");
    });
  }, [open, profile]);

  if (profile === null) return null;

  const avatar = mediaUrl(profile.image);

  // ---------- Surati nav ----------
  async function pickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Maidonro toza mekunem - ki ayni hamon faylro dubora giriftan shavad
    event.target.value = "";
    if (!file) return;

    setError("");
    setPhotoBusy(true);

    try {
      // Server webp/avif/heic-ro qabul namekunad -> ba JPEG meguzaronem
      await updateMyAvatar(token, await toJpegFile(file));
      await reload();
    } catch (err) {
      setError(errorText(err, t.photoUploadFailed));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function dropPhoto() {
    setError("");
    setPhotoBusy(true);

    try {
      await deleteMyAvatar(token);
      await reload();
    } catch (err) {
      setError(errorText(err, t.photoRemoveFailed));
    } finally {
      setPhotoBusy(false);
    }
  }

  // ---------- Saql ----------
  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setBusy(true);

    try {
      // PUT /UserProfile/update-user-profile
      const updated = await updateMyProfile(token, {
        about: about.trim() === "" ? null : about.trim(),
        gender,
      });

      // Server profili navro bar megardonad -> darhol meguzorem
      if (updated) setProfile(updated);

      onOpenChange(false);
    } catch (err) {
      setError(errorText(err, t.saveFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.editProfile}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className={`${styles.scroll} flex-1`}>
          <div className="space-y-6 px-6 py-6">
            {/* ================= SURAT ================= */}
            <div className="flex items-center gap-4 rounded-xl bg-[var(--panel)] p-4">
              <span className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-full bg-[var(--panelSoft)]">
                {avatar !== null ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={profile.userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[18px] font-bold text-[var(--muted)]">
                    {initials(profile.fullName || profile.userName)}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">
                  {profile.userName}
                </p>
                <p className="truncate text-[13px] text-[var(--muted)]">
                  {profile.fullName}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={photoBusy}
                  className="text-[14px] font-semibold text-[#0095f6] transition-opacity duration-200 hover:opacity-70 disabled:opacity-40"
                >
                  {photoBusy ? t.pleaseWait : t.photoNew}
                </button>

                {avatar !== null && (
                  <button
                    type="button"
                    onClick={dropPhoto}
                    disabled={photoBusy}
                    className="text-[13px] transition-opacity duration-200 hover:opacity-70 disabled:opacity-40"
                    style={{ color: "var(--danger)" }}
                  >
                    {t.removeAction}
                  </button>
                )}
              </div>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={pickPhoto}
              />
            </div>

            {/* ================= DAR BORAI MAN ================= */}
            <div className="space-y-2">
              <Label htmlFor="about">{t.aboutMe}</Label>
              <Textarea
                id="about"
                rows={4}
                maxLength={ABOUT_LIMIT}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                placeholder={t.aboutPlaceholder}
              />
              <p className="text-right text-[12px] text-[var(--muted)]">
                {about.length} / {ABOUT_LIMIT}
              </p>
            </div>

            {/* ================= JINS ================= */}
            <div className="space-y-2">
              <Label>{t.gender}</Label>

              <div className="flex gap-2">
                <GenderButton
                  label={t.genderMale}
                  active={gender === 0}
                  onClick={() => setGender(0)}
                />
                <GenderButton
                  label={t.genderFemale}
                  active={gender === 1}
                  onClick={() => setGender(1)}
                />
                <GenderButton
                  label={t.genderUnset}
                  active={gender === null}
                  onClick={() => setGender(null)}
                />
              </div>
            </div>

            {error !== "" && (
              <p
                className={`${styles.snap} text-[13px]`}
                style={{ color: "var(--danger)" }}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="h-8 rounded-lg px-4 text-[14px] font-semibold text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--panel)] disabled:opacity-40"
            >
              {t.cancel}
            </button>

            <button
              type="submit"
              disabled={busy}
              className="h-8 rounded-lg bg-[#0095f6] px-4 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1877f2] active:scale-[0.97] disabled:opacity-40"
            >
              {busy ? t.savingLong : t.saveShort}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GenderButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-2 text-[14px] font-semibold transition-colors duration-150 ${
        active
          ? "bg-[#0095f6] text-white"
          : "bg-[var(--panel)] text-[var(--fg)] hover:brightness-95"
      }`}
    >
      {label}
    </button>
  );
}
