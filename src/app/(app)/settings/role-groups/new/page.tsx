"use client";

import { RoleGroupEditor } from "@/components/role-groups/RoleGroupEditor";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { AccessDeniedPage } from "@/components/auth/AccessDeniedPage";

export default function NewRoleGroupPage() {
  const { can } = usePermissions();
  if (!can(P.business.role_groups.manage)) {
    return <AccessDeniedPage homeHref="/settings/role-groups" />;
  }

  return <RoleGroupEditor />;
}
