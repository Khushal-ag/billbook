"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getRequiredPermissions } from "@/lib/access/route-permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDeniedPage } from "@/components/auth/AccessDeniedPage";

export function RoutePermissionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { can } = usePermissions();

  const required = getRequiredPermissions(pathname, searchParams);
  if (required?.length && !required.some((k) => can(k))) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
