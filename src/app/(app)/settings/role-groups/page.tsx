"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, KeyRound, Loader2, Plus, Shield } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoleGroupsList } from "@/hooks/use-role-groups";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { AccessDeniedPage } from "@/components/auth/AccessDeniedPage";
import { cn } from "@/lib/utils";

export default function RoleGroupsListPage() {
  const { can } = usePermissions();
  const canSee = can(P.business.role_groups.view) || can(P.business.role_groups.manage);
  const canManage = can(P.business.role_groups.manage);

  const { data: groups, isPending, error } = useRoleGroupsList(canSee);

  const sortedGroups = useMemo(() => {
    if (!groups?.length) return [];
    return [...groups].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }, [groups]);

  const activeCount = useMemo(() => sortedGroups.filter((g) => g.isActive).length, [sortedGroups]);

  if (!canSee) {
    return <AccessDeniedPage />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Role groups"
        description="Each group holds a set of permissions. Staff are assigned one group per business—the seeded “Default (team)” matches legacy staff access."
        action={
          canManage ? (
            <Button asChild size="sm">
              <Link href="/settings/role-groups/new">
                <Plus className="mr-2 h-4 w-4" />
                New role group
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-4xl space-y-8">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : "Failed to load role groups"}
          </p>
        )}

        {isPending ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !sortedGroups.length ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">No role groups yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Create a group to bundle permissions, then assign it when you invite someone from
              Team.
            </p>
            {canManage && (
              <Button asChild className="mt-6">
                <Link href="/settings/role-groups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create role group
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  All groups
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sortedGroups.length} group{sortedGroups.length === 1 ? "" : "s"} · {activeCount}{" "}
                  active
                </p>
              </div>
            </div>
            <ul className="grid gap-3">
              {sortedGroups.map((g) => {
                const permCount = g.permissionKeys?.length ?? 0;
                return (
                  <li key={g.id}>
                    <Link
                      href={`/settings/role-groups/${g.id}`}
                      className={cn(
                        "group flex items-stretch gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-black/5 transition-colors sm:gap-4 sm:p-5",
                        "hover:border-primary/25 hover:bg-muted/20 dark:ring-white/10",
                      )}
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                        aria-hidden
                      >
                        <KeyRound className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                            {g.name}
                          </p>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {!g.isActive && (
                              <Badge variant="secondary" className="font-normal">
                                Inactive
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="font-mono text-xs font-normal tabular-nums"
                            >
                              {permCount} permission{permCount === 1 ? "" : "s"}
                            </Badge>
                          </div>
                        </div>
                        {g.description ? (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {g.description}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm italic text-muted-foreground/80">
                            No description
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center self-center text-muted-foreground transition-colors group-hover:text-primary">
                        <ChevronRight className="h-5 w-5" aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
