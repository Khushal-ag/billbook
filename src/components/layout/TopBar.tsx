import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useRoleGroupsList } from "@/hooks/use-role-groups";
import { P } from "@/constants/permissions";

interface TopBarProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  /** When true, sidebar is not visible as a rail — show business name in the top bar. */
  isMobile?: boolean;
}

export default function TopBar({
  onMenuClick,
  onSidebarToggle,
  sidebarCollapsed = false,
  isMobile = false,
}: TopBarProps) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const router = useRouter();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const organizationCode = user?.organizationCode?.trim();
  const businessName = user?.businessName?.trim();
  const handleOpenProfile = () => router.push("/profile");

  const canListRoleGroups = can(P.business.role_groups.view) || can(P.business.role_groups.manage);
  const shouldResolveRoleGroupName =
    user?.role === "STAFF" &&
    !user.roleGroupName?.trim() &&
    user.roleGroupId != null &&
    canListRoleGroups;

  const { data: roleGroups = [] } = useRoleGroupsList(shouldResolveRoleGroupName);

  const roleBadgeLabel = useMemo(() => {
    if (!user) return "";
    if (user.role === "OWNER") return "Owner";
    if (user.role === "ADMIN") return "Admin";
    if (user.role === "STAFF") {
      const fromSession = user.roleGroupName?.trim();
      if (fromSession) return fromSession;
      if (user.roleGroupId != null && roleGroups.length > 0) {
        const g = roleGroups.find((r) => r.id === user.roleGroupId);
        const n = g?.name?.trim();
        if (n) return n;
      }
      return "Staff";
    }
    return user.role;
  }, [user, roleGroups]);

  /** Desktop + expanded rail: org code only. Otherwise (mobile or collapsed rail): business name + optional org badge. */
  const desktopSidebarExpanded = !isMobile && !sidebarCollapsed;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card px-2 sm:px-3">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {onSidebarToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={onSidebarToggle}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            )}
          </Button>
        )}
        <div className="flex min-w-0 items-center gap-2">
          {desktopSidebarExpanded ? (
            organizationCode ? (
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                {organizationCode}
              </Badge>
            ) : null
          ) : (
            <>
              {businessName ? (
                <p
                  className={cn(
                    "truncate text-sm font-semibold text-foreground",
                    isMobile
                      ? "max-w-[min(100%,11rem)] sm:max-w-md"
                      : "max-w-[min(100%,14rem)] sm:max-w-md lg:max-w-lg",
                  )}
                  title={businessName}
                >
                  {businessName}
                </p>
              ) : organizationCode ? (
                <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                  {organizationCode}
                </Badge>
              ) : null}
              {organizationCode && businessName ? (
                <Badge variant="secondary" className="shrink-0 px-2 py-0.5 text-xs font-medium">
                  {organizationCode}
                </Badge>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleOpenProfile}
          className="flex items-center gap-3 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
          aria-label="Open profile"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <Badge
              variant="secondary"
              className="mt-0.5 max-w-[11rem] truncate px-1.5 py-0 text-[10px]"
              title={roleBadgeLabel}
            >
              {roleBadgeLabel}
            </Badge>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {user?.firstName?.charAt(0) || "U"}
          </div>
        </button>
      </div>
    </header>
  );
}
