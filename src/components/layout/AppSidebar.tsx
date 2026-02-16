import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  BarChart3,
  Receipt,
  FileMinus,
  CreditCard,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Logo from "@/components/Logo";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", path: "/invoices", icon: FileText },
  { label: "Products", path: "/products", icon: Package },
  { label: "Parties", path: "/parties", icon: Users },
  { label: "Credit Notes", path: "/credit-notes", icon: FileMinus },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "GST / Tax", path: "/tax", icon: Receipt },
  { label: "Subscription", path: "/subscription", icon: CreditCard },
  { label: "Audit Logs", path: "/audit-logs", icon: ScrollText, ownerOnly: true },
  { label: "Settings", path: "/settings", icon: Settings, ownerOnly: true },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}

export default function AppSidebar({
  collapsed,
  onToggle,
  onNavigate,
  showCollapseToggle = true,
}: AppSidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    // Close mobile sheet (if any) and navigate to the public landing first.
    // We pass state to prevent Landing from redirecting back to /dashboard while
    // logout is still in-flight.
    onNavigate?.();
    navigate("/", { replace: true, state: { loggedOut: true } });
    await logout();
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const visibleItems = navItems.filter((item) => !item.ownerOnly || user?.role === "OWNER");

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex h-14 shrink-0 items-center px-4 transition-opacity hover:opacity-80"
        onClick={onNavigate}
      >
        <Logo
          className="h-8 w-8 shrink-0"
          showText={!collapsed}
          textClassName="text-sm font-bold text-sidebar-foreground"
        />
      </Link>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive(item.path)
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="shrink-0 space-y-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>

        {showCollapseToggle && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("h-4 w-4 shrink-0 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed && <span className="ml-3">Collapse</span>}
          </Button>
        )}
      </div>
    </aside>
  );
}
