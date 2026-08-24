"use client";

// ============================================================
//  EditProfileModal - tahriri profil.
//  Server FAQAT du chizro ivaz kardan medihad (az swagger:
//  UpdateUserProfileDto): about va gender.
//  Nom, userName va email dar backend ivaz karda nameshavand.
// ============================================================
import { useEffect, useState } from "react";

import { errorText, updateMyProfile } from "../api";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

export default function EditProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const { profile, token, setProfile } = useProfile();

  const [about, setAbout] = useState("");
  const [gender, setGender] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Har bor ki modal kushoda meshavad - qimathoi HOZIRAI serverro meguzorem
  useEffect(() => {
    if (!open || profile === null) return;

    setAbout(profile.about ?? "");
    setGender(profile.gender);
    setError("");
  }, [open, profile]);

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
      setError(
        errorText(err, "Nigoh doshta nashud.")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>TAHRIRI PROFIL</DialogTitle>
          <DialogDescription>
            PUT / USERPROFILE / UPDATE-USER-PROFILE
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="space-y-6 px-5 py-6">
            {/* ---------- ABOUT ---------- */}
            <div className="space-y-2">
              <Label htmlFor="about">01 / DAR BORAI MAN</Label>
              <Textarea
                id="about"
                rows={4}
                maxLength={300}
                value={about}
                onChange={(event) => setAbout(event.target.value)}
                placeholder="Chand kalima dar borai khud..."
              />
              <p
                className={`${styles.mono} text-right text-[10px] tracking-[0.2em]`}
                style={{ color: "var(--muted)" }}
              >
                {about.length} / 300
              </p>
            </div>

            {/* ---------- GENDER ---------- */}
            <div className="space-y-3">
              <Label>02 / JINS</Label>

              <div className="flex gap-2">
                <GenderButton
                  label="MARD"
                  active={gender === 0}
                  onClick={() => setGender(0)}
                />
                <GenderButton
                  label="ZAN"
                  active={gender === 1}
                  onClick={() => setGender(1)}
                />
                <GenderButton
                  label="NAGUFTAN"
                  active={gender === null}
                  onClick={() => setGender(null)}
                />
              </div>
            </div>

            {error !== "" && (
              <Alert variant="destructive" className={styles.snap}>
                {error}
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              BEKOR
            </Button>

            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "NIGOH DOSHTA ISTODAAST..." : "NIGOH DOR"}
            </Button>
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
      className={`${styles.mono} flex-1 border px-2 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-colors duration-150`}
      style={
        active
          ? {
              borderColor: "var(--signal)",
              background: "var(--signal)",
              color: "var(--onSignal)",
            }
          : { borderColor: "var(--lineStrong)", color: "var(--muted)" }
      }
    >
      {label}
    </button>
  );
}
