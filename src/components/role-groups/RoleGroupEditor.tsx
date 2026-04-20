"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PermissionCatalogTree } from "@/components/role-groups/PermissionCatalogTree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRoleGroup,
  useDeleteRoleGroup,
  usePermissionCatalog,
  useRoleGroup,
  useUpdateRoleGroup,
  isRoleGroupDeleteConflict,
} from "@/hooks/use-role-groups";
import { usePermissions } from "@/hooks/use-permissions";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { P } from "@/constants/permissions";

interface RoleGroupEditorProps {
  roleGroupId?: number;
}

export function RoleGroupEditor({ roleGroupId }: RoleGroupEditorProps) {
  const router = useRouter();
  const { can } = usePermissions();
  const canManage = can(P.business.role_groups.manage);
  const isCreate = roleGroupId == null;

  const { data: existing, isPending: loadingGroup } = useRoleGroup(roleGroupId, !isCreate);
  const {
    data: catalogData,
    isPending: loadingCatalog,
    error: catalogError,
  } = usePermissionCatalog(can(P.business.role_groups.view) || can(P.business.role_groups.manage));

  const createMutation = useCreateRoleGroup();
  const updateMutation = useUpdateRoleGroup();
  const deleteMutation = useDeleteRoleGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description ?? "");
    setIsActive(existing.isActive);
    setPermissionKeys([...existing.permissionKeys].sort());
  }, [existing]);

  const readOnly = !canManage;
  const saving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showErrorToast(null, "Enter a name for this role group.");
      return;
    }
    try {
      if (isCreate) {
        await createMutation.mutateAsync({
          name: trimmed,
          description: description.trim() || null,
          isActive,
          permissionKeys,
        });
        showSuccessToast("Role group created");
        router.push("/settings/role-groups");
        router.refresh();
        return;
      }
      if (roleGroupId == null) return;
      await updateMutation.mutateAsync({
        roleGroupId,
        body: {
          name: trimmed,
          description: description.trim() || null,
          isActive,
          permissionKeys,
        },
      });
      showSuccessToast("Role group saved");
      router.push("/settings/role-groups");
      router.refresh();
    } catch (err) {
      showErrorToast(err, isCreate ? "Could not create role group" : "Could not save role group");
    }
  };

  const onDelete = async () => {
    if (roleGroupId == null) return;
    try {
      await deleteMutation.mutateAsync(roleGroupId);
      showSuccessToast("Role group deleted");
      setDeleteOpen(false);
      router.push("/settings/role-groups");
      router.refresh();
    } catch (err) {
      if (isRoleGroupDeleteConflict(err)) {
        showErrorToast(
          err,
          "This role group is still assigned to team members. Reassign them before deleting.",
        );
        return;
      }
      showErrorToast(err, "Could not delete role group");
    }
  };

  if (!isCreate && loadingGroup) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isCreate && !existing) {
    return (
      <div className="page-container animate-fade-in">
        <p className="text-sm text-muted-foreground">Role group not found.</p>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={isCreate ? "New role group" : (existing?.name ?? "Role group")}
        description={
          isCreate
            ? "Choose a name and pick permissions. Staff members assigned to this group only get the keys you enable."
            : "Update permissions for this group. Changes apply to all staff currently in the group."
        }
      />

      {catalogError && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {catalogError instanceof Error
            ? catalogError.message
            : "Could not load permission catalog"}
        </p>
      )}

      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-5xl flex-col gap-10 pb-8">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <div className="border-b border-border/70 bg-muted/20 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight">Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Name and status apply everywhere this group is assigned.
            </p>
          </div>
          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-8">
              <div className="space-y-2">
                <Label htmlFor="rg-name">Name</Label>
                <Input
                  id="rg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={readOnly}
                  required
                  placeholder="e.g. Sales, Accounts"
                />
              </div>
              <div className="space-y-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <Label htmlFor="rg-desc">Description</Label>
                <Textarea
                  id="rg-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={readOnly}
                  rows={4}
                  className="min-h-[7.5rem] resize-y"
                  placeholder="Optional — what this role is for"
                />
              </div>
              <div className="lg:col-start-1 lg:row-start-2">
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Active</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Inactive groups cannot be assigned; deactivated staff lose access until
                      reassigned.
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={readOnly}
                    className="shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70">
            <div className="border-b border-border/60 bg-muted/15 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight">Permissions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Expand an area to fine-tune keys, or use folder checkboxes to select a whole section
                at once.
              </p>
            </div>
            <div className="p-4 sm:p-5">
              {loadingCatalog ? (
                <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/10">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                </div>
              ) : catalogData?.catalog?.length ? (
                <PermissionCatalogTree
                  catalog={catalogData.catalog}
                  value={permissionKeys}
                  onChange={setPermissionKeys}
                  disabled={readOnly}
                  embedded
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No catalog entries returned from the server.
                </p>
              )}
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-col gap-4 border-t border-border/70 pt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreate ? "Create role group" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/settings/role-groups">Cancel</Link>
              </Button>
            </div>
            {!isCreate && (
              <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete role group
              </Button>
            )}
          </div>
        ) : (
          <p className="border-t border-border/70 pt-8 text-sm text-muted-foreground">
            You have read-only access to this role group.
          </p>
        )}
      </form>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role group?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If anyone still uses this group, the server will reject the
              delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void onDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
