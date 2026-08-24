// ============================================================
//  app/profile/proxy/[...path]/route.ts
//
//  CHARO IN LOZIM AST?
//  Backend sarlavhai "Access-Control-Allow-Origin" NAMEFIRISTAD.
//  Baroi hamin browser so-rovhoi mustaqimro band mekunad (CORS).
//
//  HALL: so-rovro na az browser, balki az SERVER-i khudamon
//  mefiristem. Az server ba server CORS umuman nest.
//
//  browser -> /profile/proxy/UserProfile/get-my-profile
//          -> server-i mo
//          -> https://instagram-back-qibs.onrender.com/...
//
//  DIQQAT: SURAT va VIDEO az in jo NAMEGUZARAND.
//  <img src> va <video src> ba CORS ehtiyoj nadorand,
//  onho rost az BACKEND_URL girifta meshavand.
// ============================================================
import type { NextRequest } from "next/server";

const BACKEND = "https://instagram-back-qibs.onrender.com";

async function forward(
  request: NextRequest,
  context: RouteContext<"/profile/proxy/[...path]">
) {
  const { path } = await context.params;

  // /profile/proxy/Post/like-post?postId=1 -> https://backend/Post/like-post?postId=1
  const target = `${BACKEND}/${path.join("/")}${request.nextUrl.search}`;

  // Faqat sarlavhahoi zarurro meguzaronem
  const headers = new Headers();

  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // GET va HEAD body nadorand
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const response = await fetch(target, {
    method: request.method,
    headers,
    // arrayBuffer -> JSON va surat (multipart) har du kor mekunand
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const data = await response.arrayBuffer();

  // Javobi backend-ro hamon tavr bar megardonem
  return new Response(data, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
