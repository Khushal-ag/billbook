import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  BarChart3,
  Receipt,
  FileMinus,
  CreditCard,
  Settings,
  LogOut,
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
  simpleMode?: boolean; // Show in simple mode only
  advancedOnly?: boolean; // Hide in simple mode
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Invoices", path: "/invoices", icon: FileText },
      { label: "Credit Notes", path: "/credit-notes", icon: FileMinus, advancedOnly: true },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Parties", path: "/parties", icon: Users },
      { label: "Products", path: "/products", icon: Package },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Reports", path: "/reports", icon: BarChart3, advancedOnly: true },
      { label: "Tax / GST", path: "/tax", icon: Receipt, advancedOnly: true },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Subscription", path: "/subscription", icon: CreditCard },
      {
        label: "Audit Logs",
        path: "/audit-logs",
        icon: BarChart3,
        ownerOnly: true,
        advancedOnly: true,
      },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export default function AppSidebar({ collapsed, onNavigate }: AppSidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isSimpleMode = useIsSimpleMode();

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

  const getVisibleSections = (): NavSection[] => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // Hide if owner-only and user is not owner
          if (item.ownerOnly && user?.role !== "OWNER") return false;
          // Hide if advanced-only and in simple mode
          if (item.advancedOnly && isSimpleMode) return false;
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0); // Hide empty sections
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64",
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
      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {getVisibleSections().map((section) => (
          <div key={section.title}>
            {/* Section Title */}
            {!collapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </h3>
            )}
            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => (
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
            </div>
          </div>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="shrink-0 space-y-1 p-2">
        {!collapsed && (
          <Link
            to="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive("/settings")
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
        )}

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
      </div>
    </aside>
  );
}
