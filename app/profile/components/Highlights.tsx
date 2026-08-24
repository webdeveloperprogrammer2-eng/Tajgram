"use client";

// ============================================================
//  Stories - qatori STORY-hoi man (GET /Story/get-my-stories).
//
//  DIQQAT (talabi korbar):
//    Storyi NAV az tugmai "+"-i roi AVATAR guzoshta meshavad,
//    baroi hamin in jo digar tugmai "+" nest.
//    Agar story naboshad - in qism umuman namoyon nameshavad.
//
//  "Actualniy" (highlights) qismi ALOHIDA ast - on ba'dtar
//  soakhta meshavad, hozir in jo faqat STORY hast.
// ============================================================
import { useState } from "react";

import { mediaUrl, type Story } from "../api";
import { shortDate } from "../format";
import { useProfile } from "../providers";
import styles from "../profile.module.css";

import StoryViewer from "./StoryViewer";

export default function Stories() {
  const { stories } = useProfile();

  // Kadom story kushoda ast? (index dar ro-ykhat)
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Story nest -> qism nest (ekran toza memonad)
  if (stories.length === 0) return null;

  return (
    <section className={`${styles.rise} mt-12`}>
      <div className={`${styles.scrollX} flex gap-5 pb-1`}>
        {stories.map((story, index) => (
          <StoryBubble
            key={story.id}
            story={story}
            onOpen={() => setOpenIndex(index)}
          />
        ))}
      </div>

      {/* ---------- Namoishi story ---------- */}
      <StoryViewer
        stories={stories}
        index={openIndex}
        onChangeIndex={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
}

function StoryBubble({
  story,
  onOpen,
}: {
  story: Story;
  onOpen: () => void;
}) {
  const src = mediaUrl(story.fileName);

  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center gap-2">
      <button
        type="button"
        onClick={onOpen}
        className={`${styles.ring} h-[72px] w-[72px]`}
        aria-label={`Story az ${shortDate(story.createAt)}`}
      >
        <span className={styles.ringInner}>
          {src !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </span>
      </button>

      <span
        className="truncate text-[11px] font-medium"
        style={{ color: "var(--muted)" }}
      >
        {shortDate(story.createAt)}
      </span>
    </div>
  );
}
