import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { ApiClientError } from "@/api/error";
import { invalidateQueryKeys } from "@/lib/query";
import { queryKeys } from "@/lib/query-keys";
import { REFRESH_PERMISSIONS_EVENT } from "@/constants/access-events";
import type {
  CreateRoleGroupBody,
  PermissionCatalogResponse,
  RoleGroup,
  UpdateRoleGroupBody,
} from "@/types/role-group";

function notifyRefreshPermissions() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REFRESH_PERMISSIONS_EVENT));
  }
}

export function usePermissionCatalog(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.business.permissionCatalog(),
    queryFn: async () => {
      const res = await api.get<PermissionCatalogResponse>("/business/permissions/catalog");
      return res.data;
    },
    enabled,
  });
}

export function useRoleGroupsList(enabled = true) {
  return useQuery({
    queryKey: queryKeys.business.roleGroups(),
    queryFn: async () => {
      const res = await api.get<{ roleGroups: RoleGroup[] }>("/business/role-groups");
      return res.data.roleGroups ?? [];
    },
    enabled,
  });
}

export function useRoleGroup(roleGroupId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.business.roleGroup(roleGroupId),
    queryFn: async () => {
      const res = await api.get<RoleGroup | { roleGroup: RoleGroup }>(
        `/business/role-groups/${roleGroupId}`,
      );
      const d = res.data;
      if (
        d &&
        typeof d === "object" &&
        "roleGroup" in d &&
        (d as { roleGroup?: RoleGroup }).roleGroup
      ) {
        return (d as { roleGroup: RoleGroup }).roleGroup;
      }
      return d as RoleGroup;
    },
    enabled: Boolean(roleGroupId) && enabled,
  });
}

export function useCreateRoleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRoleGroupBody) => {
      const res = await api.post<RoleGroup>("/business/role-groups", body);
      return res.data;
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.business.roleGroups()]);
      notifyRefreshPermissions();
    },
  });
}

export function useUpdateRoleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { roleGroupId: number; body: UpdateRoleGroupBody }) => {
      const res = await api.put<RoleGroup>(`/business/role-groups/${vars.roleGroupId}`, vars.body);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      invalidateQueryKeys(qc, [
        queryKeys.business.roleGroups(),
        queryKeys.business.roleGroup(vars.roleGroupId),
      ]);
      notifyRefreshPermissions();
    },
  });
}

export function useDeleteRoleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleGroupId: number) => {
      await api.delete(`/business/role-groups/${roleGroupId}`);
    },
    onSuccess: () => {
      invalidateQueryKeys(qc, [queryKeys.business.roleGroups()]);
      notifyRefreshPermissions();
    },
  });
}

export function isRoleGroupDeleteConflict(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 409;
}
