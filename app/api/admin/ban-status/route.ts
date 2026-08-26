// ============================================================
//  GET /api/admin/ban-status?userId=...
//
//  KUSHODA ast (be admin) - sahifai voridshavi ba on ehtiyoj
//  dorad: ba'di daromadan mesanjad ki oyo in korbar ban ast.
//  Faqat ma'lumoti kam bar megardonad (banned/until/reason).
// ============================================================
import type { NextRequest } from "next/server";

import { getActiveBan } from "@/lib/adminStore";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return Response.json(
      { banned: false },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const ban = await getActiveBan(userId);

  return Response.json(
    ban === null
      ? { banned: false }
      : {
          banned: true,
          until: ban.until,
          reason: ban.reason,
        },
    { headers: { "cache-control": "no-store" } },
  );
}
