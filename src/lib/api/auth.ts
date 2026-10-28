import "server-only";

import { z } from "zod";

import { apiFetch } from "./client";
import type { ApiResult } from "./errors";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  email: string;
  name: string;
  password: string;
};

const authResponseSchema = z.object({
  email: z.string(),
  name: z.string(),
  token: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

export function login(credentials: LoginCredentials): Promise<ApiResult<AuthResponse>> {
  return apiFetch("/auth/login", authResponseSchema, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(credentials: RegisterCredentials): Promise<ApiResult<AuthResponse>> {
  return apiFetch("/auth/register", authResponseSchema, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}
