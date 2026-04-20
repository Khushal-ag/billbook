"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";

/** Renders children only when the current user has the given permission key. */
export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  const { can } = usePermissions();
  if (!can(permission)) return null;
  return <>{children}</>;
}
