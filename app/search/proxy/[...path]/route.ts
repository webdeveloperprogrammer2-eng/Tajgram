// ============================================================
//  app/search/proxy/[...path]/route.ts
//
//  browser -> /search/proxy/<yak endpoint>
//          -> server-i MO
//          -> https://instagram-back-qibs.onrender.com/<hamon endpoint>
//
//  CHARO IN LOZIM AST?
//  Backend sarlavhai "Access-Control-Allow-Origin" NAMEFIRISTAD,
//  baroi hamin browser so-rovi mustaqimro band mekunad (CORS).
//  Az server ba server CORS umuman nest.
//
//  ============================================================
//  Peshtar in fayl NUSKHAI KOMILI hamon kod bud (yak khel dar
//  /search, /getInfoUsers va /Auth). Farqi khatarnok: on
//  fetch-ro daruni try/catch NAMEGIRIFT - agar backend khob
//  bosad (Render), Next.js sahifai khatoi 500-i HTML medod,
//  na javobi JSON. Sahifa on HTML-ro khonda nametavonist va
//  "khatoi nomalum" menamud.
//
//  Hozir hamai mantiq dar lib/backendProxy.ts ast - YAK JOI.
//  ============================================================
//
//  DIQQAT: SURAT va VIDEO az in jo NAMEGUZARAND.
//  <img src> va <video src> ba CORS ehtiyoj nadorand -
//  onho rost az BACKEND_URL girifta meshavand.
// ============================================================
import type { NextRequest } from "next/server";

import { forwardToBackend } from "@/lib/backendProxy";

async function forward(
  request: NextRequest,
  context: RouteContext<"/search/proxy/[...path]">
) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
