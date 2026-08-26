// ============================================================
//  app/Auth/proxy/[...path]/route.ts
//
//  browser -> /Auth/proxy/Account/login  ->  server-i mo
//          -> https://instagram-back-qibs.onrender.com/Account/login
//
//  CHARO IN LOZIM AST?
//  Backend sarlavhai "Access-Control-Allow-Origin" NAMEFIRISTAD,
//  baroi hamin browser so-rovi mustaqimro band mekunad (CORS).
//
//  ============================================================
//  IN JO YAK FARQI MUHIM HAST:
//
//  Boqi hamai proxy-ho token TALAB mekunand (be token -> 401).
//  Vale voridshavi va sabtinom tabian token NADORAND - odam
//  hanuz nadaromadaast! Baroi hamin in jo `allowAnonymous`
//  guzoshta meshavad.
//
//  Peshtar in fayl kodi TAKRORI-i khudashro dosht va fetch-ro
//  daruni try/catch namegirift: agar backend khob bosad
//  (Render 502), sahifai login khatoi 500-i HTML megirift va
//  ba korbar "khatoi nomalum" menamud. Hozir javobi JSON-i
//  fahmo meoyad.
//  ============================================================
import type { NextRequest } from "next/server";

import { forwardToBackend } from "@/lib/backendProxy";

async function forward(
  request: NextRequest,
  context: RouteContext<"/Auth/proxy/[...path]">
) {
  const { path } = await context.params;

  // allowAnonymous: login/register BE token meravand
  return forwardToBackend(request, path, { allowAnonymous: true });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
