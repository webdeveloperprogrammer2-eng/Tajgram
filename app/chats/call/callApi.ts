// ============================================================
//  app/chats/call/callApi.ts
//
//  Endpoint-hoi HAQIQII zvanok dar backend.
//  (Sanjida shud dar /docs - bakhshi "Call".)
//
//    POST /Call/start-call?receiverUserId=..&Type=audio|video
//    POST /Call/answer-call?callId=..
//    POST /Call/decline-call?callId=..
//    POST /Call/end-call?callId=..&reason=..
//    GET  /Call/get-ice-servers
//    GET  /Call/get-calls?PageNumber=&PageSize=
//    GET  /Call/get-missed-calls-count
//
//  Lifecycle (kushodan/qabul/rad/qat') az HAMIN roh meguzarad,
//  va SDP/ICE az WebSocket (./realtime.ts).
//
//  So-rovho az /chats/proxy meguzarand (CORS + token) - aynan
//  hamon tavr ki boqii papkai chats.
// ============================================================

import { API_URL, ApiError } from "../api";

export type CallType = "audio" | "video";

export type CallStatus =
  | "ringing"
  | "active"
  | "ended"
  | "declined"
  | "missed"
  | "cancelled"
  | "failed";

// CallDto-i backend
export type CallRecord = {
  callId: number;
  chatId: number | null;
  type: CallType;
  status: CallStatus;
  isOutgoing: boolean;

  callerUserId: string;
  callerUserName: string;
  callerFullName: string;
  callerImage: string | null;

  calleeUserId: string;
  calleeUserName: string;
  calleeFullName: string;
  calleeImage: string | null;

  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  endReason: string | null;

  /** Backend mego-ed: tarafi digar hozir onlayn ast yo ne. */
  isPeerOnline: boolean;

  /** Faqat dar "call:incoming" meoyad - rost ba RTCPeerConnection. */
  iceServers?: RTCIceServer[];
};

type Envelope<T> = { data: T; errors: string[] | null; statusCode: number };

async function request<T>(
  path: string,
  options: {
    method: "GET" | "POST" | "DELETE";
    token: string;
    query?: Record<string, string | number | undefined>;
  }
): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const tail = search.toString() === "" ? "" : `?${search.toString()}`;

  const headers: Record<string, string> = {};
  if (options.token !== "") headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${API_URL}${path}${tail}`, {
    method: options.method,
    headers,
    cache: "no-store",
  });

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const list = (body?.errors ?? []).filter(Boolean);
    throw new ApiError(
      list.length > 0 ? list : [`HTTP ${response.status} - ${path}`],
      body?.statusCode ?? response.status
    );
  }

  return body?.data as T;
}

/**
 * Zvanokro mekushoyad. Backend khudash ba HAMAI dastgohhoi
 * hamsuhbat "call:incoming"-ro mefiristad.
 *
 * DIQQAT: agar hamsuhbat hech payvasti kushoda nadosta bosad,
 * backend zvanokro darhol "missed" mekunad - `status` hamin
 * ma'lumotro medihad.
 */
export function startCall(
  token: string,
  receiverUserId: string,
  type: CallType
) {
  return request<CallRecord>("/Call/start-call", {
    method: "POST",
    token,
    query: { receiverUserId, Type: type },
  });
}

export function answerCall(token: string, callId: number) {
  return request<CallRecord>("/Call/answer-call", {
    method: "POST",
    token,
    query: { callId },
  });
}

export function declineCall(token: string, callId: number) {
  return request<CallRecord>("/Call/decline-call", {
    method: "POST",
    token,
    query: { callId },
  });
}

export function endCall(token: string, callId: number, reason?: string) {
  return request<CallRecord>("/Call/end-call", {
    method: "POST",
    token,
    query: { callId, reason },
  });
}

/**
 * STUN/TURN az server. TURN-ro dar kod NANAVISED - backend onro
 * medihad, to ki parolho be deploy-i nav ivaz shavand.
 */
export async function getIceServers(token: string): Promise<RTCIceServer[]> {
  const data = await request<{ iceServers?: RTCIceServer[] }>(
    "/Call/get-ice-servers",
    { method: "GET", token }
  );
  return Array.isArray(data?.iceServers) ? data.iceServers : [];
}

export function getMissedCallsCount(token: string) {
  return request<number>("/Call/get-missed-calls-count", {
    method: "GET",
    token,
  });
}

// Agar server chize nadihad - hech nabosad az in sar mekunem.
export const FALLBACK_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
