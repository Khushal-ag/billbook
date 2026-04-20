import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  Settings,
  LogOut,
  PackageCheck,
  Wallet,
  ArrowDownLeft,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BusinessIdentity } from "@/components/BusinessIdentity";
import { reportCreditNoteRegister, reportInvoiceAging } from "@/lib/report-labels";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { TeamRolesSidebarBlock } from "@/components/layout/TeamRolesSidebarBlock";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  /** If set, item is shown only when `can(permission)` */
  permission?: string;
  /** Show when user has any of these permissions (e.g. role groups view or manage) */
  anyPermission?: string[];
  /** `exact` = only `/path` matches, not `/path/...` (used for Business settings vs role groups) */
  activeMatch?: "exact" | "prefix";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        permission: P.business.dashboard.view,
      },
    ],
  },
  {
    title: "Invoicing",
    items: [{ label: "Invoices", path: "/invoices", icon: FileText, permission: P.invoice.view }],
  },
  {
    title: "Money & credit",
    items: [
      { label: "Receipts", path: "/receipts", icon: Wallet, permission: P.receipt.view },
      {
        label: "Outbound payouts",
        path: "/payments/outbound",
        icon: ArrowDownLeft,
        permission: P.payment.outbound.view,
      },
      {
        label: "Credit notes",
        path: "/credit-notes",
        icon: FileMinus,
        permission: P.credit_note.view,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Items", path: "/items", icon: Package, permission: P.item.view },
      { label: "Stock", path: "/stock", icon: PackageCheck, permission: P.item.stock.view },
    ],
  },
  {
    title: "Parties",
    items: [
      { label: "Customers", path: "/parties", icon: Users, permission: P.party.view },
      { label: "Vendors", path: "/vendors", icon: Truck, permission: P.party.view },
    ],
  },
  {
    title: "Reports & tax",
    items: [
      { label: "Reports", path: "/reports", icon: BarChart3, permission: P.reports.view },
      { label: "Tax / GST", path: "/tax", icon: Receipt, permission: P.tax.view },
    ],
  },
  {
    title: "Organization",
    items: [
      {
        label: "Business settings",
        path: "/settings",
        icon: Settings,
        permission: P.business.settings.view,
        activeMatch: "exact",
      },
      { label: "Audit logs", path: "/audit-logs", icon: ScrollText, permission: P.audit.view },
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

const reportNavItems = [
  { label: reportCreditNoteRegister.title, path: "/reports/credit-note-register" },
  { label: reportInvoiceAging.navLabel, path: "/reports/receivables-aging" },
];

export default function AppSidebar({ collapsed, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { can } = usePermissions();
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

  const isNavItemActive = (item: NavItem) => {
    if (isPartyLedgerRoute && ledgerSource === "vendors") {
      if (item.path === "/vendors") return true;
      if (item.path === "/parties") return false;
    }
    const p = (safePathname.split("?")[0] ?? "").replace(/\/$/, "") || "/";
    const base = item.path.replace(/\/$/, "") || "/";
    if (item.path === "/dashboard") return p === "/dashboard";
    if (item.activeMatch === "exact") return p === base;
    return p === base || p.startsWith(`${base}/`);
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
  const reportsExpanded = safePathname.startsWith("/reports");

  const getVisibleSections = (): NavSection[] => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.anyPermission?.length) {
            if (!item.anyPermission.some((key) => can(key))) return false;
          } else if (item.permission && !can(item.permission)) {
            return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "flex h-14 shrink-0 items-center px-4 transition-opacity hover:opacity-80",
          collapsed && "justify-center px-2",
          !collapsed && "w-full",
        )}
        onClick={onNavigate}
        aria-label="Dashboard"
      >
        <BusinessIdentity
          name={user?.businessName}
          logoUrl={user?.businessLogoUrl}
          size="sm"
          showName={!collapsed}
          className={cn("min-w-0", !collapsed && "w-full overflow-hidden")}
          nameClassName="min-w-0 truncate text-sm font-semibold text-sidebar-foreground"
        />
      </Link>

      <Separator className="bg-sidebar-border" />

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-2 py-4">
        {getVisibleSections().map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/45">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.title === "Organization" && (
                <TeamRolesSidebarBlock
                  collapsed={collapsed}
                  safePathname={safePathname}
                  can={can}
                  onNavigate={onNavigate}
                />
              )}
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
                ) : item.path === "/reports" && !collapsed ? (
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
                      <span>Reports</span>
                      <ChevronDown
                        className={cn(
                          "ml-auto h-3.5 w-3.5 transition-transform",
                          reportsExpanded && "rotate-180",
                        )}
                      />
                    </Link>
                    {reportsExpanded && (
                      <div className="ml-6 mt-1 space-y-1">
                        {reportNavItems.map((reportItem) => (
                          <Link
                            key={reportItem.path}
                            href={reportItem.path}
                            onClick={onNavigate}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm transition-colors",
                              isActive(reportItem.path)
                                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            )}
                          >
                            {reportItem.label}
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
                      isNavItemActive(item)
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

      <div className="shrink-0 space-y-1 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Log out</span>}
        </Button>

        {!collapsed && (
          <>
            <Separator className="bg-sidebar-border" />
            <div className="flex w-full flex-nowrap items-center justify-start gap-2 px-2 py-2">
              <span className="shrink-0 text-xs font-semibold tracking-wide text-white sm:text-sm">
                Billbook
              </span>
              <img
                src="/hench-logo.png"
                alt="Hench Solutions"
                width={560}
                height={186}
                className="h-10 max-h-10 w-auto min-w-0 max-w-[70%] shrink object-contain object-left"
                decoding="async"
                draggable={false}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
