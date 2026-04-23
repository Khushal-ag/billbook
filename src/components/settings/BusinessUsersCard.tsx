"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Eye, EyeOff, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useBusinessUsers,
  useCreateStaffMember,
  useUpdateStaffMembership,
} from "@/hooks/use-business";
import { useRoleGroupsList } from "@/hooks/use-role-groups";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/AuthContext";
import { P } from "@/constants/permissions";
import { PAGE } from "@/constants/page-access";
import { strongPasswordSchema } from "@/lib/core/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import type { BusinessUser } from "@/types/auth";
import type { RoleGroup } from "@/types/role-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core/utils";

interface BusinessUsersCardProps {
  embedded?: boolean;
}

const optionalName = z.string().max(100, "Max 100 characters").optional().or(z.literal(""));

const addStaffSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(255),
    roleGroupId: z.coerce.number().int().positive("Choose a role group"),
    firstName: optionalName,
    lastName: optionalName,
    password: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const pw = (data.password ?? "").trim();
    if (pw === "") return;
    const parsed = strongPasswordSchema.safeParse(pw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ["password"] });
      }
    }
  });

type AddStaffForm = z.infer<typeof addStaffSchema>;

const reactivateSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

type ReactivateForm = z.infer<typeof reactivateSchema>;

function memberInitials(u: BusinessUser): string {
  const a = u.firstName?.trim()?.[0];
  const b = u.lastName?.trim()?.[0];
  if (a && b) return `${a}${b}`.toUpperCase();
  if (a) return a.toUpperCase();
  if (b) return b.toUpperCase();
  const local = u.email.split("@")[0] ?? u.email;
  return local.slice(0, 2).toUpperCase();
}

function TeamMemberActions({
  member,
  patchMutation,
  onDeactivate,
  onReactivate,
  roleGroups,
  canManage,
  canInvite,
  onRoleGroupChange,
}: {
  member: BusinessUser;
  patchMutation: ReturnType<typeof useUpdateStaffMembership>;
  onDeactivate: (u: BusinessUser) => void;
  onReactivate: (u: BusinessUser) => void;
  roleGroups: RoleGroup[];
  canManage: boolean;
  canInvite: boolean;
  onRoleGroupChange: (member: BusinessUser, roleGroupId: number) => void;
}) {
  if (member.role === "OWNER") {
    return null;
  }

  const patchBusy =
    patchMutation.isPending && patchMutation.variables?.businessUserId === member.id;

  const assignableGroups = roleGroups.filter((g) => g.isActive);

  if (!member.isActive) {
    if (!canInvite) return null;
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => onReactivate(member)}>
        Reactivate
      </Button>
    );
  }

  if (!canManage && !canInvite) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage && assignableGroups.length > 0 && (
        <Select
          value={member.roleGroupId != null ? String(member.roleGroupId) : undefined}
          onValueChange={(v) => onRoleGroupChange(member, Number(v))}
          disabled={patchBusy}
        >
          <SelectTrigger
            className="h-9 min-w-[10rem] max-w-[14rem] text-xs"
            aria-label="Role group"
          >
            <SelectValue placeholder="Role group" />
          </SelectTrigger>
          <SelectContent>
            {assignableGroups.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={patchBusy}
          onClick={() => onDeactivate(member)}
        >
          {patchBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Deactivate"}
        </Button>
      )}
    </div>
  );
}

export function BusinessUsersCard({ embedded = false }: BusinessUsersCardProps) {
  const { can } = usePermissions();
  const { user: sessionUser, refreshSession } = useAuth();
  const canView = can(P.business.team.view);
  const canInvite = can(P.business.team.invite);
  const canManage = can(P.business.team.manage);
  const canSeeRoleGroups = can(PAGE.role_groups) || can(PAGE.role_groups_manage);

  const { data: users, isPending, error } = useBusinessUsers(canView);
  const { data: roleGroups = [] } = useRoleGroupsList(canInvite || canManage);
  const createStaff = useCreateStaffMember();
  const patchMembership = useUpdateStaffMembership();

  const [deactivateTarget, setDeactivateTarget] = useState<BusinessUser | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<BusinessUser | null>(null);
  const [showReactivatePassword, setShowReactivatePassword] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const defaultRoleGroupId = roleGroups.find((g) => g.isActive)?.id;

  const addForm = useForm<AddStaffForm>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      email: "",
      roleGroupId: 0,
      firstName: "",
      lastName: "",
      password: "",
    },
  });

  useEffect(() => {
    if (defaultRoleGroupId && addForm.getValues("roleGroupId") === 0) {
      addForm.setValue("roleGroupId", defaultRoleGroupId);
    }
  }, [defaultRoleGroupId, addForm]);

  const reactivateForm = useForm<ReactivateForm>({
    resolver: zodResolver(reactivateSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const memberStats = useMemo(() => {
    if (!users?.length) return { total: 0, active: 0 };
    const active = users.filter((u) => u.isActive).length;
    return { total: users.length, active };
  }, [users]);

  if (!canView) {
    return null;
  }

  const onAddSubmit = addForm.handleSubmit(async (values) => {
    try {
      const email = values.email.trim().toLowerCase();
      const fn = values.firstName?.trim();
      const ln = values.lastName?.trim();
      const pwd = values.password?.trim();
      await createStaff.mutateAsync({
        email,
        roleGroupId: values.roleGroupId,
        ...(fn ? { firstName: fn } : {}),
        ...(ln ? { lastName: ln } : {}),
        ...(pwd ? { password: pwd } : {}),
      });
      showSuccessToast("Team member added");
      addForm.reset({
        email: "",
        roleGroupId: defaultRoleGroupId ?? 0,
        firstName: "",
        lastName: "",
        password: "",
      });
    } catch (err) {
      showErrorToast(err, "Could not add team member");
    }
  });

  const onReactivateSubmit = reactivateForm.handleSubmit(async (values) => {
    if (!reactivateTarget) return;
    const rgId =
      reactivateTarget.roleGroupId ?? roleGroups.find((g) => g.isActive)?.id ?? roleGroups[0]?.id;
    if (rgId == null) {
      showErrorToast(null, "No role group available — create one under Role groups first.");
      return;
    }
    try {
      await createStaff.mutateAsync({
        email: reactivateTarget.email.trim().toLowerCase(),
        roleGroupId: rgId,
        password: values.password,
        ...(reactivateTarget.firstName?.trim()
          ? { firstName: reactivateTarget.firstName.trim() }
          : {}),
        ...(reactivateTarget.lastName?.trim()
          ? { lastName: reactivateTarget.lastName.trim() }
          : {}),
      });
      showSuccessToast("Team member reactivated");
      setReactivateTarget(null);
      reactivateForm.reset({ password: "", confirmPassword: "" });
      setShowReactivatePassword(false);
    } catch (err) {
      showErrorToast(err, "Could not reactivate");
    }
  });

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await patchMembership.mutateAsync({
        businessUserId: deactivateTarget.id,
        isActive: false,
      });
      showSuccessToast("Team member deactivated");
      setDeactivateTarget(null);
      if (deactivateTarget.userId === sessionUser?.id) void refreshSession();
    } catch (err) {
      showErrorToast(err, "Could not deactivate");
    }
  };

  const handleRoleGroupChange = async (member: BusinessUser, roleGroupId: number) => {
    if (member.roleGroupId === roleGroupId) return;
    try {
      await patchMembership.mutateAsync({
        businessUserId: member.id,
        roleGroupId,
      });
      showSuccessToast("Role group updated");
      if (member.userId === sessionUser?.id) void refreshSession();
    } catch (err) {
      showErrorToast(err, "Could not update role group");
    }
  };

  const headerEmbedded = embedded ? (
    <div className="mb-6">
      <h3 className="text-base font-semibold tracking-tight">Team & access</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite staff with the same organization code they will use at login. Owners can change
        business settings; staff cannot.
      </p>
    </div>
  ) : null;

  const addSection = canInvite ? (
    <div className="border-b border-border/70">
      <div className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Invite someone</h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              They&apos;ll use this business&apos;s organization code at sign-in.{" "}
              {canSeeRoleGroups ? (
                <>
                  Permission sets live in{" "}
                  <Link
                    href="/settings/role-groups"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Role groups
                  </Link>
                  .
                </>
              ) : (
                "Choose a role group that matches what they should be allowed to do."
              )}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <form onSubmit={onAddSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-email" required>
                Email
              </Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="off"
                placeholder="colleague@example.com"
                {...addForm.register("email")}
              />
              {addForm.formState.errors.email && (
                <FieldError>{addForm.formState.errors.email.message}</FieldError>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-role-group" required>
                Role group
              </Label>
              <Controller
                control={addForm.control}
                name="roleGroupId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="staff-role-group">
                      <SelectValue placeholder="Select a role group" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleGroups
                        .filter((g) => g.isActive)
                        .map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {addForm.formState.errors.roleGroupId && (
                <FieldError>{addForm.formState.errors.roleGroupId.message}</FieldError>
              )}
              {roleGroups.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No role groups loaded. You need permission to list role groups, or ask an owner to
                  configure them under Settings → Role groups.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-first">First name</Label>
              <Input id="staff-first" placeholder="Optional" {...addForm.register("firstName")} />
              {addForm.formState.errors.firstName && (
                <FieldError>{addForm.formState.errors.firstName.message}</FieldError>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last">Last name</Label>
              <Input id="staff-last" placeholder="Optional" {...addForm.register("lastName")} />
              {addForm.formState.errors.lastName && (
                <FieldError>{addForm.formState.errors.lastName.message}</FieldError>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staff-password">Password</Label>
              <div className="relative">
                <Input
                  id="staff-password"
                  type={showAddPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Leave blank if they already have a BillBook account"
                  className="pr-10"
                  {...addForm.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  onClick={() => setShowAddPassword((v) => !v)}
                  aria-label={showAddPassword ? "Hide password" : "Show password"}
                >
                  {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {addForm.formState.errors.password && (
                <FieldError>{addForm.formState.errors.password.message}</FieldError>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                <strong>Required</strong> for someone new to BillBook, or when bringing back a
                deactivated member. <strong>Leave blank</strong> only if they already have an
                account elsewhere and are not yet in this business.
              </p>
            </div>
          </div>
          <Button type="submit" disabled={createStaff.isPending} className="w-full sm:w-auto">
            {createStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add team member
          </Button>
        </form>
      </div>
    </div>
  ) : null;

  const listContent = () => {
    if (error) {
      return (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Failed to load team"}
        </p>
      );
    }
    if (!users || users.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" aria-hidden />
          </div>
          <h4 className="mt-4 text-base font-semibold tracking-tight">No team members yet</h4>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {canInvite
              ? "Use the form above to invite someone. They’ll sign in with your organization code and the role group you pick."
              : "When your owner invites staff, they will appear here."}
          </p>
        </div>
      );
    }

    const sorted = [...users].sort((a, b) => {
      if (a.role === "OWNER" && b.role !== "OWNER") return -1;
      if (a.role !== "OWNER" && b.role === "OWNER") return 1;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.email.localeCompare(b.email);
    });

    return (
      <ul className="grid gap-3" role="list" aria-label="Team members list">
        {sorted.map((u) => {
          const displayName =
            u.firstName || u.lastName ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : u.email;
          return (
            <li key={u.id} role="listitem">
              <div
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-black/5 transition-colors",
                  "dark:ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                  "hover:border-primary/20 hover:bg-muted/15",
                )}
              >
                <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary"
                    aria-hidden
                  >
                    {memberInitials(u)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-snug text-foreground">{displayName}</p>
                      {u.role === "OWNER" ? (
                        <Badge className="font-normal">Owner</Badge>
                      ) : (
                        <Badge variant="outline" className="max-w-[12rem] truncate font-normal">
                          {u.roleGroupName ?? "Staff"}
                        </Badge>
                      )}
                      {!u.isActive && (
                        <Badge variant="secondary" className="font-normal">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:pl-2">
                  <TeamMemberActions
                    member={u}
                    patchMutation={patchMembership}
                    onDeactivate={setDeactivateTarget}
                    onReactivate={(member) => {
                      setReactivateTarget(member);
                      reactivateForm.reset({ password: "", confirmPassword: "" });
                    }}
                    roleGroups={roleGroups}
                    canManage={canManage}
                    canInvite={canInvite}
                    onRoleGroupChange={handleRoleGroupChange}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const membersSubtitle =
    !isPending && users && users.length > 0
      ? `${memberStats.active} active · ${memberStats.total} total`
      : "People who can access this business";

  const membersBlock = (
    <div>
      <div className="border-b border-border/60 bg-muted/15 px-5 py-4 sm:px-6">
        <h3 className="text-lg font-semibold tracking-tight">Team members</h3>
        <p className="mt-1 text-sm text-muted-foreground">{membersSubtitle}</p>
      </div>
      <div className="p-4 sm:p-5">
        {isPending ? (
          <div className="space-y-3" aria-label="Loading team members">
            <Skeleton className="h-[5.25rem] rounded-2xl" />
            <Skeleton className="h-[5.25rem] rounded-2xl" />
            <Skeleton className="h-[5.25rem] rounded-2xl" />
          </div>
        ) : (
          listContent()
        )}
      </div>
    </div>
  );

  const shellInner = (
    <>
      {addSection}
      {membersBlock}
    </>
  );

  const wrapped = embedded ? (
    <div>
      {headerEmbedded}
      {shellInner}
    </div>
  ) : (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      {shellInner}
    </div>
  );

  return (
    <>
      {wrapped}

      <AlertDialog
        open={deactivateTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget ? (
                <>
                  <span className="font-medium text-foreground">{deactivateTarget.email}</span> will
                  be signed out and cannot access this business until reactivated.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={patchMembership.isPending}
              onClick={() => void confirmDeactivate()}
            >
              {patchMembership.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={reactivateTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setReactivateTarget(null);
            reactivateForm.reset();
            setShowReactivatePassword(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reactivate team member</DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <span className="font-medium text-foreground">{reactivateTarget?.email}</span>. They
              will use this organization&apos;s code and this email at login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onReactivateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reactivate-pw" required>
                New password
              </Label>
              <div className="relative">
                <Input
                  id="reactivate-pw"
                  type={showReactivatePassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  {...reactivateForm.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  onClick={() => setShowReactivatePassword((v) => !v)}
                  aria-label={showReactivatePassword ? "Hide password" : "Show password"}
                >
                  {showReactivatePassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {reactivateForm.formState.errors.password && (
                <FieldError>{reactivateForm.formState.errors.password.message}</FieldError>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reactivate-pw2" required>
                Confirm password
              </Label>
              <Input
                id="reactivate-pw2"
                type={showReactivatePassword ? "text" : "password"}
                autoComplete="new-password"
                {...reactivateForm.register("confirmPassword")}
              />
              {reactivateForm.formState.errors.confirmPassword && (
                <FieldError>{reactivateForm.formState.errors.confirmPassword.message}</FieldError>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReactivateTarget(null);
                  reactivateForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createStaff.isPending}>
                {createStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reactivate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
