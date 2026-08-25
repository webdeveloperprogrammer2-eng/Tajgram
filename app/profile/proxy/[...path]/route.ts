// ============================================================
//  app/profile/proxy/[...path]/route.ts
//
//  browser -> /profile/proxy/Post/like-post?postId=1
//          -> https://instagram-back-qibs.onrender.com/Post/like-post?postId=1
//
//  Hamai mantiq dar lib/backendProxy.ts ast (CORS + token).
//  MUHIM: agar browser token-i khudi korbarro nafiristad,
//  proxy bo akkaunti KHIZMATI medarod - AYNAN hamon tavr ki
//  /api/backend (lentai asosi) kor mekunad. Be in, /profile
//  meguft "Avval daroed", vale lenta kor mekard.
//
//  DIQQAT: SURAT va VIDEO az in jo NAMEGUZARAND.
//  <img src> va <video src> ba CORS ehtiyoj nadorand,
//  onho rost az BACKEND_URL girifta meshavand.
// ============================================================
import type { NextRequest } from "next/server";

import { forwardToBackend } from "@/lib/backendProxy";

async function forward(
  request: NextRequest,
  context: RouteContext<"/profile/proxy/[...path]">
) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
