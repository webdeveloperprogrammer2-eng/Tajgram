// ============================================================
//  /api/admin/complaints   (FAQAT admin)
//
//  GET    ?userId=...  -> shikoyathoi yak korbar
//  GET                 -> shumorai shikoyathoi HAMAI korbaron (counts)
//  POST   { userId, text }        -> shikoyati nav
//  DELETE ?userId=..&id=..        -> shikoyatro pok kardan
// ============================================================
import type { NextRequest } from "next/server";

import { isAdminRequest, decodeJwt } from "@/lib/adminAuth";
import {
  listComplaints,
  addComplaint,
  removeComplaint,
  complaintCounts,
  type Complaint,
} from "@/lib/adminStore";

function forbidden() {
  return Response.json(
    { error: "Faqat admin" },
    { status: 403, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return forbidden();

  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    const counts = await complaintCounts();
    return Response.json(
      { counts },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const complaints = await listComplaints(userId);
  return Response.json(
    { complaints },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return forbidden();

  let body: { userId?: string; text?: string };
  try {
    body = (await request.json()) as { userId?: string; text?: string };
  } catch {
    return Response.json({ error: "JSON нодуруст" }, { status: 400 });
  }

  if (!body.userId || !body.text?.trim()) {
    return Response.json(
      { error: "userId va text lozim ast" },
      { status: 400 },
    );
  }

  const bearer = request.headers.get("authorization")?.slice(7) ?? "";
  const by = decodeJwt(bearer)?.userName ?? "admin";

  const complaint: Complaint = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    by,
    text: body.text.trim(),
    createdAt: Date.now(),
  };

  const complaints = await addComplaint(body.userId, complaint);
  return Response.json(
    { complaints },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return forbidden();

  const userId = request.nextUrl.searchParams.get("userId");
  const id = request.nextUrl.searchParams.get("id");

  if (!userId || !id) {
    return Response.json(
      { error: "userId va id lozim ast" },
      { status: 400 },
    );
  }

  const complaints = await removeComplaint(userId, id);
  return Response.json(
    { complaints },
    { headers: { "cache-control": "no-store" } },
  );
}
