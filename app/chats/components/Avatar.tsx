"use client";

// ============================================================
//  Avatar - suratcha gird bo khalqai gradient.
//  Agar surat naboshad - harfhoi avvali nom.
//  (<img>-i oddi, chunki suratho az domeni digar meoyand)
// ============================================================
import { mediaUrl } from "../api";
import { initials } from "../format";
import styles from "../chats.module.css";

export default function Avatar({
  image,
  name,
  size = 52,
  ring = true,
}: {
  image: string | null;
  name: string;
  size?: number;
  ring?: boolean;
}) {
  const src = mediaUrl(image);

  return (
    <span
      className={ring ? styles.ring : undefined}
      style={{ height: size, width: size, flexShrink: 0 }}
    >
      <span
        className={styles.ringInner}
        style={{ fontSize: Math.max(11, Math.round(size / 3)) }}
      >
        {src !== null ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          initials(name)
        )}
      </span>
    </span>
  );
}
