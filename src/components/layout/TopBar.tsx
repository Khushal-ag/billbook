import { useAuth } from "@/contexts/AuthContext";
import { useUIMode } from "@/contexts/UIModeContext";
import { useSimpleLabel } from "@/hooks/use-simple-mode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Menu, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export default function TopBar({
  onMenuClick,
  onSidebarToggle,
  sidebarCollapsed = false,
}: TopBarProps) {
  const { user } = useAuth();
  const { mode, setMode } = useUIMode();
  const modeLabel = useSimpleLabel("Advanced", "Simple");
  const modeToggleTitle = useSimpleLabel("Switch to Simple Mode", "Switch to Advanced Mode");
  const navigate = useNavigate();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";
  const organizationCode = user?.organizationCode?.trim();
  const handleOpenProfile = () => navigate("/profile");

  // Avatar/logo for business: use logo if available, else initials from business name
  const businessInitials = (() => {
    const name = user?.businessName?.trim() || "";
    if (!name) return "B";
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

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
        <div className="flex items-center gap-2">
          {user?.businessLogoUrl ? (
            <img
              src={user.businessLogoUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-md bg-muted object-contain"
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground"
              aria-hidden
            >
              {businessInitials}
            </div>
          )}
          <h2 className="truncate text-sm font-semibold">{user?.businessName}</h2>
          {organizationCode && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {organizationCode}
            </Badge>
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
