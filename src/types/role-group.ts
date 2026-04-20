export type PermissionCatalogNode =
  | {
      type: "folder";
      id: string;
      label: string;
      children: PermissionCatalogNode[];
    }
  | {
      type: "permission";
      key: string;
      label: string;
    };

export interface PermissionCatalogResponse {
  keys: string[];
  catalog: PermissionCatalogNode[];
}

export interface RoleGroup {
  id: number;
  businessId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  permissionKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleGroupBody {
  name: string;
  description?: string | null;
  isActive?: boolean;
  permissionKeys: string[];
}

export type UpdateRoleGroupBody = Partial<{
  name: string;
  description: string | null;
  isActive: boolean;
  permissionKeys: string[];
}>;
