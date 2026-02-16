import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card px-4 sm:px-6">
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
        <h2 className="truncate text-sm font-semibold">{user?.businessName}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-[10px]">
            {user?.role}
          </Badge>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {user?.firstName?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}
