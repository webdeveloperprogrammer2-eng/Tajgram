"use client";

// ============================================================
//  FollowListModal - ro-ykhati FOLOWERS yo FOLOWING.
//
//  GET /FollowingRelationShip/get-subscribers   -> folowers
//  GET /FollowingRelationShip/get-subscriptions -> folowing
//
//  Dar hamin jo metavon obuna shud yo obunaro bekor kard:
//  POST/DELETE .../[add|delete]-following-relation-ship
// ============================================================
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  errorText,
  follow,
  getFollowers,
  getFollowing,
  mediaUrl,
  unfollow,
  type FollowUser,
} from "../api";
import { initials } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import { Alert } from "../ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { useT } from "@/components/LocaleProvider";

export type FollowTab = "followers" | "following";

export default function FollowListModal({
  tab,
  userId,
  myUserId,
  onClose,
}: {
  tab: FollowTab | null;
  /** Profili KI-ro meboinem (ro-ykhat az HAMIN odam ast). */
  userId: string;
  /** KI man hastam - ba KHUDAM tugmai "Obuna" lozim nest. */
  myUserId: string;
  onClose: () => void;
}) {
  const { t } = useT();
  const { token, reload } = useProfile();

  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  // Ro-ykhatro az server megirem
  async function loadList(which: FollowTab) {
    setLoading(true);
    setError("");

    try {
      const data =
        which === "followers"
          ? await getFollowers(token, userId)
          : await getFollowing(token, userId);

      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        errorText(err, t.listLoadFailed)
      );
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  // Har bor ki modal kushoda meshavad -> ro-ykhatro az nav megirem
  useEffect(() => {
    if (tab === null || token === "") return;
    queueMicrotask(() => void loadList(tab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token, userId]);

  // Obuna / bekor kardani obuna
  async function toggleFollow(user: FollowUser) {
    setPendingId(user.userId);
    setError("");

    try {
      if (user.isFollowing) {
        await unfollow(token, user.userId);
      } else {
        await follow(token, user.userId);
      }

      // Dar ro-ykhat darhol ivaz mekunem
      setList((old) =>
        old.map((item) =>
          item.userId === user.userId
            ? { ...item, isFollowing: !item.isFollowing }
            : item
        )
      );

      // Hisobhoi profil (folowing) ham nav meshavand
      await reload();
    } catch (err) {
      setError(errorText(err, t.actionFailed));
    } finally {
      setPendingId("");
    }
  }

  const title = tab === "followers" ? t.titleFollowers : t.titleFollowing;
  const endpoint =
    tab === "followers"
      ? "GET / FOLLOWINGRELATIONSHIP / GET-SUBSCRIBERS"
      : "GET / FOLLOWINGRELATIONSHIP / GET-SUBSCRIPTIONS";

  return (
    <Dialog
      open={tab !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{endpoint}</DialogDescription>
        </DialogHeader>

        <div className={`${styles.scroll} max-h-[60vh]`}>
          {loading && (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error !== "" && (
            <div className="p-5">
              <Alert variant="destructive" className={styles.snap}>
                {error}
              </Alert>
            </div>
          )}

          {!loading && error === "" && list.length === 0 && (
            <p
              className={`${styles.mono} p-8 text-center text-[10px] uppercase tracking-[0.24em]`}
              style={{ color: "var(--muted)" }}
            >
              — {t.nobodyYet} —
            </p>
          )}

          {!loading &&
            list.map((user) => {
              const avatar = mediaUrl(user.image);

              // Ba profili KHUDAM -> /profile, ba digaron -> /profile/[userId]
              const href =
                user.userId === myUserId
                  ? "/profile"
                  : `/profile/${user.userId}`;

              return (
                <div
                  key={user.userId}
                  className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
                  style={{ borderColor: "var(--line)" }}
                >
                  <Link
                    href={href}
                    onClick={onClose}
                    className="shrink-0"
                    aria-label={user.userName}
                  >
                    <Avatar
                      className="h-11 w-11 border transition-opacity duration-200 hover:opacity-80"
                      style={{ borderColor: "var(--line)" }}
                    >
                      {avatar !== null && (
                        <AvatarImage src={avatar} alt={user.userName} />
                      )}
                      <AvatarFallback className="text-xs">
                        {initials(user.fullName || user.userName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <Link
                    href={href}
                    onClick={onClose}
                    className="min-w-0 flex-1 transition-opacity duration-200 hover:opacity-80"
                  >
                    <p className="truncate text-xs font-bold uppercase tracking-[0.12em]">
                      {user.userName}
                    </p>
                    <p
                      className={`${styles.mono} truncate text-[10px] tracking-[0.1em]`}
                      style={{ color: "var(--muted)" }}
                    >
                      {user.fullName}
                    </p>
                  </Link>

                  {/* KHATO BUD: in jo bo `userId` mesanjid - ya'ne bo
                      SOHIBI profil, na bo KHUDI MAN. Dar profili
                      kasi digar natija chunin meshud: tugmai on odam
                      penhon mешud, vale tugmai KHUDAM memond va
                      server "ba khud obuna shudan mumkin nest" megift. */}
                  {user.userId !== myUserId && (
                    <Button
                      size="sm"
                      variant={user.isFollowing ? "outline" : "default"}
                      disabled={pendingId === user.userId}
                      onClick={() => toggleFollow(user)}
                    >
                      {user.isFollowing ? t.unfollowShort : t.followShort}
                    </Button>
                  )}
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
