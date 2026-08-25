import type { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forwardToBackend(request, path);
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
