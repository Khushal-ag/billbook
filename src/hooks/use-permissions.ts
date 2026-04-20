import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/auth";

/**
 * RBAC helpers — permission keys come from GET /auth/me (`user.permissions`).
 * Owners are treated as allowed for all checks (belt-and-suspenders if the session predates `permissions`).
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissionSet = useMemo(() => new Set(user?.permissions ?? []), [user?.permissions]);

  const can = useCallback(
    (key: string) => {
      if (!user) return false;
      if (user.role === "OWNER") return true;
      return permissionSet.has(key);
    },
    [user, permissionSet],
  );

  return {
    isOwner: user?.role === "OWNER",
    isStaff: user?.role === "STAFF",
    role: user?.role as Role | undefined,
    user,
    can,
    permissionSet,
  };
}
