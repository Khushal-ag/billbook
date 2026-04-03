import { useAuth } from "@/contexts/AuthContext";
import { useUIMode } from "@/contexts/UIModeContext";
import { useSimpleLabel } from "@/hooks/use-simple-mode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Menu, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
  const { mode, setMode } = useUIMode();
  const modeLabel = useSimpleLabel("Advanced", "Simple");
  const modeToggleTitle = useSimpleLabel("Switch to Simple Mode", "Switch to Advanced Mode");
  const router = useRouter();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const organizationCode = user?.organizationCode?.trim();
  const businessName = user?.businessName?.trim();
  const handleOpenProfile = () => router.push("/profile");

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
            <ChevronLeft
              className={cn("h-5 w-5 transition-transform", sidebarCollapsed && "rotate-180")}
            />
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
        <div className="hidden items-center gap-2 pr-4 sm:flex">
          <Label htmlFor="mode-toggle" className="cursor-pointer text-xs text-muted-foreground">
            {modeLabel}
          </Label>
          <Switch
            id="mode-toggle"
            checked={mode === "advanced"}
            onCheckedChange={(checked) => setMode(checked ? "advanced" : "simple")}
            title={modeToggleTitle}
          />
        </div>
        <button
          type="button"
          onClick={handleOpenProfile}
          className="flex items-center gap-3 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
          aria-label="Open profile"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-[10px]">
              {user?.role}
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
