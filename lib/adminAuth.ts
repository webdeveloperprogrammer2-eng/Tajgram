// ============================================================
//  lib/adminAuth.ts   (FAQAT dar server)
//
//  Kist "admin"? Korbare ki userName-i on AYNAN "admin" ast.
//  Token (JWT) daruni khud userName-ро dorad, baroi hamin mo
//  onро dar server mekushoem va mesanjem.
//
//  DIQQAT: in jo mo IMZO-i token-ro tasdiq NAMEKUNEM (baroi on
//  kaliti махфии backend lozim ast, ki dar mo nest). Vale
//  hamai amalhoi VOQEI (delete-user va g.) az backend meguzarand
//  va onjo token az nav sanjida meshavad. In jo faqat "darvoza"-i
//  paneli admin ast.
// ============================================================
import type { NextRequest } from "next/server";

export const ADMIN_USERNAME = "admin";

type JwtPayload = {
  sub?: string;
  userName?: string;
  email?: string;
  exp?: number;
};

/** JWT-ро mekushoem (be tasdiqi imzo). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function bearerOf(request: NextRequest): string | null {
  const raw = request.headers.get("authorization");
  if (raw === null) return null;
  if (!raw.toLowerCase().startsWith("bearer ")) return null;
  const value = raw.slice(7).trim();
  return value === "" ? null : value;
}

/** Token-i so-rov ba korbari "admin" tааluq dorad? */
export function isAdminRequest(request: NextRequest): boolean {
  const token = bearerOf(request);
  if (token === null) return false;

  const payload = decodeJwt(token);
  if (payload === null) return false;

  // Token guzashta?
  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return payload.userName === ADMIN_USERNAME;
}
