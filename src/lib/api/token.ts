import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "USER"]);

export type UserRole = z.infer<typeof userRoleSchema>;

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  ADMIN: 1,
};

export const DEFAULT_USER_ROLE: UserRole = "USER";

export function hasRoleAccess(role: UserRole, requiredRole: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[requiredRole];
}

export const jwtClaimsSchema = z.object({
  exp: z.number(),
});

export type JwtClaims = z.infer<typeof jwtClaimsSchema>;

export type SessionUser = {
  email: string;
  name: string;
  role: UserRole;
};

export function decodeClaims(token: string): JwtClaims | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const json: unknown = JSON.parse(atob(base64));
    const parsed = jwtClaimsSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getSecondsUntilExpiration(claims: JwtClaims): number {
  return claims.exp - Math.floor(Date.now() / 1000);
}

export function isTokenExpired(claims: JwtClaims): boolean {
  return getSecondsUntilExpiration(claims) <= 0;
}
