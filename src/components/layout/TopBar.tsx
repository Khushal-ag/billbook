import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function TopBar() {
  const { user } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold">{user?.businessName}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
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
