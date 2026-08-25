import type { NextRequest } from "next/server";

const BACKEND = "https://instagram-back-qibs.onrender.com";

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const target = `${BACKEND}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();

  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const data = await response.arrayBuffer();

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
