"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getRequiredPermission } from "@/lib/route-permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDeniedPage } from "@/components/auth/AccessDeniedPage";

export function RoutePermissionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { can } = usePermissions();

  const required = getRequiredPermission(pathname);
  if (required && !can(required)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
