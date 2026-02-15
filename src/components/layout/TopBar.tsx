import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function TopBar() {
  const { user } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold">{user?.businessName}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <Badge variant="secondary" className="mt-0.5 text-[10px] px-1.5 py-0">
            {user?.role}
          </Badge>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
          {user?.firstName?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}
