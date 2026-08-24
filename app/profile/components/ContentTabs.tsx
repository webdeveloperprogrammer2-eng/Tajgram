"use client";

// ============================================================
//  ContentTabs - se qism: POSTHO / REELS / SAQLSHUDAHO.
//  Ayni monandi instagram - dar zeri profil.
// ============================================================
import { useState } from "react";
import { Bookmark, Film, Grid3x3 } from "lucide-react";

import { errorText, getFavoritePosts, type Post } from "../api";
import { useProfile } from "../providers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PostGrid from "./PostGrid";
import ReelsGrid from "./ReelsGrid";

export default function ContentTabs() {
  const { posts, reels, token } = useProfile();

  const [favorites, setFavorites] = useState<Post[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");

  async function loadFavorites() {
    if (favoritesLoaded) return;

    try {
      const data = await getFavoritePosts(token);
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      setFavoritesError(
        errorText(err, "Бор нашуд.")
      );
    } finally {
      setFavoritesLoaded(true);
    }
  }

  return (
    <section className="mt-12">
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">
            <Grid3x3 strokeWidth={1.6} />
            ПОСТҲО
          </TabsTrigger>

          <TabsTrigger value="reels">
            <Film strokeWidth={1.6} />
            РИЙЛС
          </TabsTrigger>

          <TabsTrigger value="saved" onClick={loadFavorites}>
            <Bookmark strokeWidth={1.6} />
            ЗАХИРАШУДАҲО
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostGrid posts={posts} />
        </TabsContent>

        <TabsContent value="reels">
          <ReelsGrid reels={reels} />
        </TabsContent>

        <TabsContent value="saved">
          {favoritesError !== "" ? (
            <p
              className="py-24 text-center text-[13px]"
              style={{ color: "var(--signal)" }}
            >
              {favoritesError}
            </p>
          ) : (
            <PostGrid posts={favorites} />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
