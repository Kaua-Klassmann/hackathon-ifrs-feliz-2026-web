import type { ReactNode } from "react";

import { forbidden, redirect } from "next/navigation";

import { getSession } from "@/lib/api/session";
import { hasRoleAccess } from "@/lib/api/token";

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!hasRoleAccess(session.role, "ADMIN")) {
    forbidden();
  }

  return children;
}
