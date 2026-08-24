"use client";

// ============================================================
//  PostGrid - turi posthoi man (3 sutun, monandi instagram).
//
//  Vaqte mush ba boloi surat meravad ->
//  hisobi LIKE, PROSMOTR va KOMMENT namoyon meshavad.
//  Vaqte zad -> PostModal kushoda meshavad.
// ============================================================
import { useState } from "react";
import { Eye, Heart, Images, MessageCircle } from "lucide-react";

import { mediaUrl, type Post } from "../api";
import { shortNumber } from "../format";
import styles from "../profile.module.css";

import PostModal from "./PostModal";

export default function PostGrid({ posts }: { posts: Post[] }) {
  // Kadom post kushoda ast?
  const [openPost, setOpenPost] = useState<Post | null>(null);

  // Agar post naboshad
  if (posts.length === 0) {
    return (
      <p
        className="py-24 text-center text-[13px]"
        style={{ color: "var(--muted)" }}
      >
        Hanuz post nest
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 py-2 sm:gap-3 sm:py-3">
        {posts.map((post) => {
          // Surati AVVAL - ba'zan post chand surat dorad
          const cover = mediaUrl(post.images[0]?.imageName);

          return (
            <button
              key={post.postId}
              type="button"
              onClick={() => setOpenPost(post)}
              className={styles.cell}
            >
              {cover !== null && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={post.title ?? "Post"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Nishona: post chand surat dorad */}
              {post.images.length > 1 && (
                <span className="absolute right-2 top-2 text-white drop-shadow">
                  <Images className="h-4 w-4" strokeWidth={1.6} />
                </span>
              )}

              {/* Sathi siyoh bo raqamho (faqat hangomi hover) */}
              <span className={styles.cellOverlay}>
                <span className="flex items-center gap-1.5 text-xs tabular-nums">
                  <Heart className="h-4 w-4" strokeWidth={1.6} />
                  {shortNumber(post.postLikeCount)}
                </span>

                <span className="flex items-center gap-1.5 text-xs tabular-nums">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
                  {shortNumber(post.commentCount)}
                </span>

                <span className="flex items-center gap-1.5 text-xs tabular-nums">
                  <Eye className="h-4 w-4" strokeWidth={1.6} />
                  {shortNumber(post.postViewCount)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
    </>
  );
}
