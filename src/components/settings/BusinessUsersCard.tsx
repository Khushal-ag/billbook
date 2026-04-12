"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usePermissions } from "@/hooks/use-permissions";
import { strongPasswordSchema } from "@/lib/validation-schemas";
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
import type { BusinessUser } from "@/types/auth";

interface BusinessUsersCardProps {
  embedded?: boolean;
}

const optionalName = z.string().max(100, "Max 100 characters").optional().or(z.literal(""));

const addStaffSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email").max(255),
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

function TeamMemberActions({
  member,
  patchMutation,
  onDeactivate,
  onReactivate,
}: {
  member: BusinessUser;
  patchMutation: ReturnType<typeof useUpdateStaffMembership>;
  onDeactivate: (u: BusinessUser) => void;
  onReactivate: (u: BusinessUser) => void;
}) {
  if (member.role === "OWNER") {
    return null;
  }

  const patchBusy =
    patchMutation.isPending && patchMutation.variables?.businessUserId === member.id;

  if (!member.isActive) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => onReactivate(member)}>
        Reactivate
      </Button>
    );
  }

  return (
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
  );
}

export function BusinessUsersCard({ embedded = false }: BusinessUsersCardProps) {
  const { isOwner } = usePermissions();
  const { data: users, isPending, error } = useBusinessUsers();
  const createStaff = useCreateStaffMember();
  const patchMembership = useUpdateStaffMembership();

  const [deactivateTarget, setDeactivateTarget] = useState<BusinessUser | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<BusinessUser | null>(null);
  const [showReactivatePassword, setShowReactivatePassword] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const addForm = useForm<AddStaffForm>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { email: "", firstName: "", lastName: "", password: "" },
  });

  const reactivateForm = useForm<ReactivateForm>({
    resolver: zodResolver(reactivateSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!isOwner) {
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
        ...(fn ? { firstName: fn } : {}),
        ...(ln ? { lastName: ln } : {}),
        ...(pwd ? { password: pwd } : {}),
      });
      showSuccessToast("Team member added");
      addForm.reset({ email: "", firstName: "", lastName: "", password: "" });
    } catch (err) {
      showErrorToast(err, "Could not add team member");
    }
  });

  const onReactivateSubmit = reactivateForm.handleSubmit(async (values) => {
    if (!reactivateTarget) return;
    try {
      await createStaff.mutateAsync({
        email: reactivateTarget.email.trim().toLowerCase(),
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
    } catch (err) {
      showErrorToast(err, "Could not deactivate");
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

  const addSection = (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        Add team member
      </div>
      <form onSubmit={onAddSubmit} className="space-y-4">
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
              deactivated member. <strong>Leave blank</strong> only if they already have an account
              elsewhere and are not yet in this business.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={createStaff.isPending}>
          {createStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add team member
        </Button>
      </form>
    </div>
  );

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
        <p className="text-sm text-muted-foreground">
          No team members yet. Add someone above — they will sign in with this business&apos;s
          organization code.
        </p>
      );
    }

    const sorted = [...users].sort((a, b) => {
      if (a.role === "OWNER" && b.role !== "OWNER") return -1;
      if (a.role !== "OWNER" && b.role === "OWNER") return 1;
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.email.localeCompare(b.email);
    });

    return (
      <div className="space-y-3" role="list" aria-label="Team members list">
        {sorted.map((u) => (
          <div
            key={u.id}
            role="listitem"
            className="flex flex-col gap-3 rounded-lg border bg-background/50 px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {u.firstName || u.lastName
                  ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                  : u.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary"
                aria-label={`Role: ${u.role.toLowerCase()}`}
              >
                {u.role.toLowerCase()}
              </span>
              {!u.isActive && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Inactive
                </span>
              )}
              <TeamMemberActions
                member={u}
                patchMutation={patchMembership}
                onDeactivate={setDeactivateTarget}
                onReactivate={(member) => {
                  setReactivateTarget(member);
                  reactivateForm.reset({ password: "", confirmPassword: "" });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const body = (
    <div className="space-y-8">
      {addSection}
      {isPending ? (
        <div className="space-y-3" aria-label="Loading team members">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
        </div>
      ) : (
        listContent()
      )}
    </div>
  );

  const wrapped = embedded ? (
    <div>
      {headerEmbedded}
      {body}
    </div>
  ) : (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team & access</CardTitle>
        <CardDescription>Organization members — invite staff and manage access</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
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
