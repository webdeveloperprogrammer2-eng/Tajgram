"use client";

// ============================================================
//  PostGrid - turi posthoi man (3 sutun, monandi instagram).
//
//  Vaqte mush ba boloi surat meravad -> hisobi LIKE va KOMMENT
//  namoyon meshavad (AYNAN hamon du raqame ki instagram
//  nishon medihad - na se).
//  Vaqte zad -> PostModal kushoda meshavad.
//
//  Peshtar khonaho kunjhoi 16px va "parvoz"-i hover doshtand -
//  instagram kunji GIRD nadorad va khona az joyash namejunbad.
// ============================================================
import { useState } from "react";
import { Copy, Heart, ImageOff, MessageCircle, Play } from "lucide-react";

import { isVideoName, mediaUrl, type Post } from "../api";
import { shortNumber } from "../format";

import { ProfileEmpty, ProfileGrid } from "@/components/profile/ProfileTabs";
import { useT } from "@/components/LocaleProvider";

import PostModal from "./PostModal";

export default function PostGrid({
  posts,
  kind = "posts",
}: {
  posts: Post[];
  kind?: "posts" | "saved";
}) {
  // Kadom post kushoda ast?
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const { t } = useT();

  if (posts.length === 0) {
    return (
      <ProfileEmpty
        icon={<ImageOff className="h-7 w-7" strokeWidth={1.6} />}
        title={kind === "saved" ? t.noSavedPosts : t.noPostsTitle}
        text={kind === "saved" ? t.savedEmptyText : t.postsEmptyText}
      />
    );
  }

  return (
    <>
      <ProfileGrid>
        {posts.map((post) => {
          // Surati AVVAL - ba'zan post chand surat dorad
          const first = post.images[0]?.imageName ?? null;
          const cover = mediaUrl(first);
          const many = post.images.length > 1;
          const video = isVideoName(first);

          return (
            <button
              key={post.postId}
              type="button"
              onClick={() => setOpenPost(post)}
              className="group relative aspect-square overflow-hidden bg-[var(--panel)]"
            >
              {cover !== null &&
                (video ? (
                  <video
                    src={cover}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={post.title ?? t.tabPosts}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ))}

              {/* Nishonai kunji rost: albom yo video */}
              {(many || video) && (
                <span className="pointer-events-none absolute top-2 right-2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                  {video ? (
                    <Play className="h-4 w-4 fill-current" strokeWidth={0} />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={2} />
                  )}
                </span>
              )}

              {/* Pardai siyoh bo raqamho - faqat dar kompyuter (hover) */}
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-7 bg-black/35 text-[15px] font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Heart className="h-5 w-5 fill-current" strokeWidth={0} />
                  {shortNumber(post.postLikeCount)}
                </span>

                <span className="flex items-center gap-1.5 tabular-nums">
                  <MessageCircle
                    className="h-5 w-5 fill-current"
                    strokeWidth={0}
                  />
                  {shortNumber(post.commentCount)}
                </span>
              </span>
            </button>
          );
        })}
      </ProfileGrid>

      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
    </>
  );
}
