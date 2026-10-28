"use server";

import { redirect } from "next/navigation";

import {
  login,
  register,
  type AuthResponse,
  type LoginCredentials,
  type RegisterCredentials,
} from "@/lib/api/auth";
import { type ApiResult, err, MESSAGES, ok } from "@/lib/api/errors";
import { clearSessionCookie, setSessionCookie } from "@/lib/api/session";
import { DEFAULT_USER_ROLE, type SessionUser } from "@/lib/api/token";

async function startSession(response: AuthResponse): Promise<ApiResult<{ user: SessionUser }>> {
  const stored = await setSessionCookie({
    token: response.token,
    email: response.email,
    name: response.name,
  });

  if (!stored) {
    return err({ type: "parse", message: MESSAGES.ourFault });
  }

  return ok({
    user: {
      email: response.email,
      name: response.name,
      role: DEFAULT_USER_ROLE,
    },
  });
}

export async function loginAction(input: LoginCredentials): Promise<ApiResult<{ user: SessionUser }>> {
  const result = await login(input);
  if (!result.ok) {
    return result;
  }

  return startSession(result.data);
}

export async function registerAction(input: RegisterCredentials): Promise<ApiResult<{ user: SessionUser }>> {
  const result = await register(input);
  if (!result.ok) {
    return result;
  }

  return startSession(result.data);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/auth/login");
}
