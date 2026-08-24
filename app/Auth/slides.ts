// ============================================================
//  app/Auth/slides.ts
//  10 surat baroi swiper-i tarafi chap.
//  Suratho az Unsplash girifta meshavand (bepul, adresi mustaqim).
//  `caption` - kalidi matn az i18n.ts (baroi 3 zabon).
// ============================================================

export type Slide = {
  id: string;      // id-i surat dar Unsplash
  caption: string; // kalid dar lugat: t[caption]
};

// Adresi purrai surat mesozem.
// w=1400 - bar-i surat; q=80 - sifat; auto=format - browser
// khudash formati sabuktarro (webp) megirad.
export function photoUrl(id: string, width = 1400) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

export const SLIDES: Slide[] = [
  { id: "photo-1529156069898-49953e39b3ac", caption: "slideFriends" },
  { id: "photo-1543807535-eceef0bc6599", caption: "slideFamily" },
  { id: "photo-1511632765486-a01980e01a18", caption: "slideTogether" },
  { id: "photo-1470071459604-3b5ec3a7fe05", caption: "slideTravel" },
  { id: "photo-1517457373958-b7bdd4587205", caption: "slideChildren" },
  { id: "photo-1519671482749-fd09be7ccebf", caption: "slideParty" },
  { id: "photo-1509099836639-18ba1795216d", caption: "slideSmile" },
  { id: "photo-1541532713592-79a0317b6b77", caption: "slideCity" },
  { id: "photo-1516450360452-9312f5e86fc7", caption: "slideSummer" },
  { id: "photo-1478147427282-58a87a120781", caption: "slideEvening" },
];
