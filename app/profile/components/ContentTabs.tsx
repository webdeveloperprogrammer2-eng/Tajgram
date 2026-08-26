"use client";

// ============================================================
//  ContentTabs - qismi poyoni profil, monandi instagram:
//    POSTHO / REELS / SAQLSHUDA
//
//  POSTHO      -> az provider (GET /Post/get-my-posts)
//  REELS       -> az provider (GET /Reels/get-my-reels)
//  SAQLSHUDAHO -> GET /UserProfile/get-post-favorites
//                 (faqat hangomi zadan bor meshavad)
//
//  Peshtar in jo @radix-ui/react-tabs bud bo sabki khudash.
//  Hozir hamon tabhoi umumi kor mekunand ki dar profili
//  korbari DIGAR ham hastand - to du sahifa yak khel bosand.
// ============================================================
import { useState } from "react";
import { Bookmark, Clapperboard, Grid3x3 } from "lucide-react";

import { errorText, getFavoritePosts, type Post } from "../api";
import { useProfile } from "../providers";

import { ProfileTabs, type ProfileTab } from "@/components/profile/ProfileTabs";
import { useT } from "@/components/LocaleProvider";

import PostGrid from "./PostGrid";
import ReelsGrid from "./ReelsGrid";

export default function ContentTabs() {
  const { posts, reels, token } = useProfile();
  const { t } = useT();

  // Matni tabho az lughat meoyad - baroi hamin DARUNI component.
  const tabs: ProfileTab[] = [
    { id: "posts", label: t.tabPosts, icon: <Grid3x3 strokeWidth={2} /> },
    { id: "reels", label: t.tabReels, icon: <Clapperboard strokeWidth={2} /> },
    { id: "saved", label: t.tabSaved, icon: <Bookmark strokeWidth={2} /> },
  ];

  const [tab, setTab] = useState("posts");

  // Saqlshudaho faqat hangomi zadan bor meshavand (ki behuda so-rov naravad)
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");

  async function openTab(id: string) {
    setTab(id);

    if (id !== "saved" || favoritesLoaded) return;

    // Diqqat: bayraqro PESH az so-rov meguzorem - vagarna
    // du bor zadan du so-rovi barobar mefiristod.
    setFavoritesLoaded(true);
    setFavoritesError("");

    try {
      const data = await getFavoritePosts(token);
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      setFavoritesError(errorText(err, t.loadFailed));
      setFavoritesLoaded(false); // to bori digar sanjidan mumkin bosad
    }
  }

  return (
    <section>
      <ProfileTabs tabs={tabs} active={tab} onChange={openTab} />

      {tab === "posts" && <PostGrid posts={posts} kind="posts" />}
      {tab === "reels" && <ReelsGrid reels={reels} />}

      {tab === "saved" &&
        (favoritesError !== "" ? (
          <p
            className="py-24 text-center text-[14px]"
            style={{ color: "var(--danger)" }}
          >
            {favoritesError}
          </p>
        ) : (
          <PostGrid posts={favorites} kind="saved" />
        ))}
    </section>
  );
}
