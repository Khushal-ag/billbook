import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsSimpleMode } from "@/hooks/use-simple-mode";
import {
  LayoutDashboard,
  FileText,
  ChevronDown,
  Package,
  Users,
  Truck,
  BarChart3,
  Receipt,
  FileMinus,
  CreditCard,
  Settings,
  LogOut,
  PackageCheck,
  Wallet,
  ArrowDownLeft,
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
  simpleMode?: boolean;
  advancedOnly?: boolean;
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
      { label: "Receipts", path: "/receipts", icon: Wallet },
      { label: "Payments out", path: "/payments/outbound", icon: ArrowDownLeft },
      { label: "Credit Notes", path: "/credit-notes", icon: FileMinus, advancedOnly: true },
    ],
  },
  {
    title: "Master",
    items: [
      { label: "Items", path: "/items", icon: Package },
      { label: "Vendor", path: "/vendors", icon: Truck },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Stock", path: "/stock", icon: PackageCheck },
      { label: "Customer", path: "/parties", icon: Users },
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

const invoiceNavItems = [
  { label: "Sales Invoice", path: "/invoices/sales" },
  { label: "Purchase Invoice", path: "/invoices/purchases" },
  { label: "Sales Return", path: "/invoices/sales-return" },
  { label: "Purchase Return", path: "/invoices/purchase-return" },
];

export default function AppSidebar({ collapsed, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, user } = useAuth();
  const isSimpleMode = useIsSimpleMode();
  const safePathname = pathname ?? "";
  const ledgerSource = searchParams.get("from");
  const isPartyLedgerRoute = /^\/parties\/[^/]+\/ledger\/?$/.test(safePathname);

  const handleLogout = async () => {
    onNavigate?.();
    router.replace("/?loggedOut=1");
    await logout();
  };

  const isActive = (path: string) => {
    if (isPartyLedgerRoute && ledgerSource === "vendors") {
      if (path === "/vendors") return true;
      if (path === "/parties") return false;
    }

    if (path === "/dashboard") return safePathname === "/dashboard";
    return safePathname.startsWith(path);
  };

  const isInvoiceTypeActive = (path: string) => {
    if (safePathname.startsWith(path)) return true;
    if (safePathname !== "/invoices/new") return false;

    const type = searchParams.get("type");
    const typeToPath: Record<string, string> = {
      SALE_INVOICE: "/invoices/sales",
      PURCHASE_INVOICE: "/invoices/purchases",
      SALE_RETURN: "/invoices/sales-return",
      PURCHASE_RETURN: "/invoices/purchase-return",
    };

    return typeToPath[type ?? ""] === path;
  };

  const invoicesExpanded = safePathname.startsWith("/invoices");

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
        href="/dashboard"
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
              {section.items.map((item) =>
                item.path === "/invoices" && !collapsed ? (
                  <div key={item.path} className="space-y-0.5">
                    <Link
                      href={item.path}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive(item.path)
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>Invoices</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto h-3.5 w-3.5 transition-transform",
                          invoicesExpanded && "rotate-180",
                        )}
                      />
                    </Link>
                    {invoicesExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {invoiceNavItems.map((invoiceItem) => (
                          <Link
                            key={invoiceItem.path}
                            href={invoiceItem.path}
                            onClick={onNavigate}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm transition-colors",
                              isInvoiceTypeActive(invoiceItem.path)
                                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            )}
                          >
                            {invoiceItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    href={item.path}
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
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="shrink-0 space-y-1 p-2">
        {!collapsed && (
          <Link
            href="/settings"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive("/settings")
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Business settings</span>
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
