function readNestedRoleGroup(raw: unknown): { id: unknown; name: string | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name =
    (typeof o.name === "string" && o.name) ||
    (typeof o.groupName === "string" && o.groupName) ||
    (typeof o.label === "string" && o.label) ||
    (typeof o.title === "string" && o.title) ||
    null;
  return { id: o.id ?? o.roleGroupId, name: name?.trim() ? name.trim() : null };
}

/**
 * GET /auth/me `user` payloads may use camelCase, snake_case, or nested `roleGroup`.
 * Normalize so the client always gets roleGroupId + roleGroupName when the API sends them.
 */
export function extractRoleGroupFromAuthMeUser(user: unknown): {
  roleGroupId: number | null;
  roleGroupName: string | null;
} {
  if (!user || typeof user !== "object") {
    return { roleGroupId: null, roleGroupName: null };
  }

  const u = user as Record<string, unknown>;

  const nestedObjects = [
    u.roleGroup,
    u.role_group,
    u.roleGroupDto,
    u.role_group_dto,
    u.currentRoleGroup,
    u.current_role_group,
    u.membershipRoleGroup,
    u.membership_role_group,
  ];

  let nested: { id: unknown; name: string | null } | null = null;
  for (const c of nestedObjects) {
    const parsed = readNestedRoleGroup(c);
    if (parsed && (parsed.id != null || parsed.name)) {
      nested = parsed;
      break;
    }
  }

  const nameRaw =
    (typeof u.roleGroupName === "string" && u.roleGroupName) ||
    (typeof u.role_group_name === "string" && u.role_group_name) ||
    (typeof u.groupName === "string" && u.groupName) ||
    (typeof u.group_name === "string" && u.group_name) ||
    (typeof u.currentRoleGroupName === "string" && u.currentRoleGroupName) ||
    (typeof u.current_role_group_name === "string" && u.current_role_group_name) ||
    nested?.name ||
    null;

  const idRaw = u.roleGroupId ?? u.role_group_id ?? (nested ? nested.id : undefined);

  let roleGroupId: number | null = null;
  if (typeof idRaw === "number" && Number.isFinite(idRaw)) {
    roleGroupId = idRaw;
  } else if (typeof idRaw === "string" && /^\d+$/.test(idRaw)) {
    const n = Number(idRaw);
    if (Number.isFinite(n)) roleGroupId = n;
  }

  const roleGroupName =
    typeof nameRaw === "string" && nameRaw.trim().length > 0 ? nameRaw.trim() : null;

  return { roleGroupId, roleGroupName };
}

/** Some APIs attach the current role group to `business` in GET /auth/me. */
export function extractRoleGroupFromAuthMeBusiness(business: unknown): {
  roleGroupId: number | null;
  roleGroupName: string | null;
} {
  if (!business || typeof business !== "object") {
    return { roleGroupId: null, roleGroupName: null };
  }
  const b = business as Record<string, unknown>;
  return extractRoleGroupFromAuthMeUser({
    roleGroup: b.roleGroup ?? b.role_group,
    roleGroupId: b.roleGroupId ?? b.role_group_id,
    roleGroupName: b.roleGroupName ?? b.role_group_name,
  });
}
