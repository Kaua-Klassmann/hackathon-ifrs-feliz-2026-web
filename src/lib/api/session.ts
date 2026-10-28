import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { createLogger } from "@/lib/logger";

import {
  DEFAULT_USER_ROLE,
  decodeClaims,
  getSecondsUntilExpiration,
  type SessionUser,
} from "./token";

const log = createLogger("auth");

const SESSION_COOKIE = "session";

const sessionCookieSchema = z.object({
  token: z.string(),
  email: z.string(),
  name: z.string(),
});

export type SessionPayload = z.infer<typeof sessionCookieSchema>;

export async function setSessionCookie(payload: SessionPayload): Promise<boolean> {
  const claims = decodeClaims(payload.token);
  if (!claims) {
    log.error("session_cookie_rejected", { reason: "undecodable_token" });
    return false;
  }

  const maxAge = getSecondsUntilExpiration(claims);
  if (maxAge <= 0) {
    log.error("session_cookie_rejected", { reason: "expired_token" });
    return false;
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return true;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

function readSessionCookie(raw: string): SessionPayload | null {
  try {
    const parsed = sessionCookieSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      log.warn("session_cookie_malformed", { reason: "schema_mismatch" });
      return null;
    }
    return parsed.data;
  } catch {
    log.warn("session_cookie_malformed", { reason: "invalid_json" });
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  const payload = readSessionCookie(raw);
  if (!payload) {
    return null;
  }

  const claims = decodeClaims(payload.token);
  if (!claims || getSecondsUntilExpiration(claims) <= 0) {
    log.debug("session_ended", { reason: claims ? "expired_token" : "undecodable_token" });
    return null;
  }

  return {
    email: payload.email,
    name: payload.name,
    role: DEFAULT_USER_ROLE,
  };
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return raw ? (readSessionCookie(raw)?.token ?? null) : null;
}
