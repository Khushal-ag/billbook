"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  LayoutGrid,
  FileText,
  ChevronDown,
  ChevronRight,
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
  Folder,
  TrendingUp,
  ShoppingCart,
  ReceiptIndianRupee,
  HandCoins,
  Landmark,
  Boxes,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/core/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BusinessIdentity } from "@/components/BusinessIdentity";
import { usePermissions } from "@/hooks/use-permissions";
import { INVOICE_PAGE_ACCESS_KEYS, PAGE } from "@/constants/page-access";
import { TeamRolesSidebarBlock } from "@/components/layout/TeamRolesSidebarBlock";

interface NavItem {
  label: string;
  path: string;
  icon: ElementType;
  /** If set, item is shown only when `can(pageKey)` — see `PAGE` in `@/constants/page-access`. */
  pageKey?: string;
  /** Show when user has any of these page keys */
  anyPageKey?: string[];
  /** `exact` = only `/path` matches, not `/path/...` (used for Business settings vs role groups) */
  activeMatch?: "exact" | "prefix";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

type SectionTitle = NavSection["title"];

/** Sidebar sections follow the active route until the user folds/expands; then we store explicit open state (including “none”). */
type SectionFoldMode = { kind: "route" } | { kind: "custom"; open: SectionTitle | null };

/** Distinct icons per reports route; unknown paths use {@link BarChart3}. */
function reportSidebarIcon(reportPath: string): ElementType {
  const base = reportPath.replace(/\/$/, "") || "/";
  switch (base) {
    case "/reports":
      return LayoutGrid;
    case "/reports/invoice-register":
      return TrendingUp;
    case "/reports/purchase-register":
      return ShoppingCart;
    case "/reports/receipt-register":
      return ReceiptIndianRupee;
    case "/reports/debt-register":
      return HandCoins;
    case "/reports/payables-register":
      return Landmark;
    case "/reports/item-register":
      return Boxes;
    case "/reports/credit-note-register":
      return FileMinus;
    case "/reports/payout-register":
      return ArrowDownLeft;
    case "/reports/receivables-aging":
      return CalendarClock;
    default:
      return BarChart3;
  }
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Master",
    items: [
      { label: "Items", path: "/items", icon: Package, pageKey: PAGE.items },
      { label: "Stock", path: "/stock", icon: PackageCheck, pageKey: PAGE.stock },
    ],
  },
  {
    title: "Parties",
    items: [
      { label: "Customers", path: "/parties", icon: Users, pageKey: PAGE.parties },
      { label: "Vendors", path: "/vendors", icon: Truck, pageKey: PAGE.vendors },
    ],
  },
  {
    title: "Accounting",
    items: [
      {
        label: "Invoices",
        path: "/invoices",
        icon: FileText,
        anyPageKey: [...INVOICE_PAGE_ACCESS_KEYS],
      },
      { label: "Receipts", path: "/receipts", icon: Wallet, pageKey: PAGE.receipts },
      {
        label: "Credit Notes",
        path: "/credit-notes",
        icon: FileMinus,
        pageKey: PAGE.credit_notes,
      },
      {
        label: "Payments",
        path: "/payments/outbound",
        icon: ArrowDownLeft,
        pageKey: PAGE.payments_outbound,
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        label: "Reports Dashboard",
        path: "/reports",
        icon: reportSidebarIcon("/reports"),
        pageKey: PAGE.reports,
        activeMatch: "exact",
      },
      {
        label: "Sales register",
        path: "/reports/invoice-register",
        icon: reportSidebarIcon("/reports/invoice-register"),
        pageKey: PAGE.reports_sales_register,
      },
      {
        label: "Purchase register",
        path: "/reports/purchase-register",
        icon: reportSidebarIcon("/reports/purchase-register"),
        pageKey: PAGE.reports_purchase_register,
      },
      {
        label: "Receipt register",
        path: "/reports/receipt-register",
        icon: reportSidebarIcon("/reports/receipt-register"),
        pageKey: PAGE.reports_receipt_register,
      },
      {
        label: "Debt register",
        path: "/reports/debt-register",
        icon: reportSidebarIcon("/reports/debt-register"),
        pageKey: PAGE.reports_debt_register,
      },
      {
        label: "Payables register",
        path: "/reports/payables-register",
        icon: reportSidebarIcon("/reports/payables-register"),
        pageKey: PAGE.reports_payables_register,
      },
      {
        label: "Item register",
        path: "/reports/item-register",
        icon: reportSidebarIcon("/reports/item-register"),
        pageKey: PAGE.reports_item_register,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Profile", path: "/profile", icon: Users, pageKey: PAGE.profile },
      {
        label: "Business Settings",
        path: "/settings",
        icon: Settings,
        pageKey: PAGE.settings,
        activeMatch: "exact",
      },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Tax / GST", path: "/tax", icon: Receipt, pageKey: PAGE.tax },
      { label: "Audit Logs", path: "/audit-logs", icon: ScrollText, pageKey: PAGE.audit_logs },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

const invoiceNavItems = [
  { label: "Sales Invoice", path: "/invoices/sales", pageKey: PAGE.invoices_sales },
  { label: "Purchase Invoice", path: "/invoices/purchases", pageKey: PAGE.invoices_purchases },
  { label: "Sales Return", path: "/invoices/sales-return", pageKey: PAGE.invoices_sales_return },
  {
    label: "Purchase Return",
    path: "/invoices/purchase-return",
    pageKey: PAGE.invoices_purchase_return,
  },
] as const;

export default function AppSidebar({ collapsed, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { can } = usePermissions();
  const [sectionFold, setSectionFold] = useState<SectionFoldMode>({ kind: "route" });
  const safePathname = pathname ?? "";
  const normalizedPathname = (safePathname.split("?")[0] ?? "").replace(/\/$/, "") || "/";
  const ledgerSource = searchParams.get("from");
  const isPartyLedgerRoute = /^\/parties\/[^/]+\/ledger\/?$/.test(safePathname);

  const handleLogout = async () => {
    onNavigate?.();
    router.replace("/?loggedOut=1");
    await logout();
  };

  const isPathActive = useCallback(
    (path: string, activeMatch: NavItem["activeMatch"] = "prefix") => {
      if (isPartyLedgerRoute && ledgerSource === "vendors") {
        if (path === "/vendors") return true;
        if (path === "/parties") return false;
      }

      const base = path.replace(/\/$/, "") || "/";
      if (base === "/dashboard") return normalizedPathname === "/dashboard";
      if (activeMatch === "exact") return normalizedPathname === base;
      return normalizedPathname === base || normalizedPathname.startsWith(`${base}/`);
    },
    [isPartyLedgerRoute, ledgerSource, normalizedPathname],
  );

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

  const invoicesExpanded =
    normalizedPathname === "/invoices" || normalizedPathname.startsWith("/invoices/");
  const visibleSections = useMemo((): NavSection[] => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.anyPageKey?.length) {
            if (!item.anyPageKey.some((key) => can(key))) return false;
          } else if (item.pageKey && !can(item.pageKey)) {
            return false;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [can]);

  const isSettingsSidebarRoute =
    normalizedPathname === "/profile" ||
    normalizedPathname === "/settings" ||
    normalizedPathname === "/team" ||
    normalizedPathname.startsWith("/settings/role-groups");

  const activeSection = useMemo(() => {
    return (
      visibleSections.find((section) => {
        if (section.title === "Settings") {
          return (
            isSettingsSidebarRoute ||
            section.items.some((item) => isPathActive(item.path, item.activeMatch))
          );
        }

        return section.items.some((item) => isPathActive(item.path, item.activeMatch));
      })?.title ?? null
    );
  }, [isPathActive, isSettingsSidebarRoute, visibleSections]);

  useEffect(() => {
    setSectionFold({ kind: "route" });
  }, [activeSection]);

  const openSection: SectionTitle | null =
    sectionFold.kind === "route" ? activeSection : sectionFold.open;

  const handleSectionToggle = (sectionTitle: SectionTitle) => {
    setSectionFold((prev) => {
      const currentlyOpen = prev.kind === "route" ? activeSection : prev.open;
      if (currentlyOpen === sectionTitle) {
        return { kind: "custom", open: null };
      }
      return { kind: "custom", open: sectionTitle };
    });
  };

  const sectionButtonClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
      active
        ? "text-sidebar-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
    );

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

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {visibleSections.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-sidebar-border/50 bg-sidebar-accent/10 p-1.5"
          >
            {!collapsed && (
              <button
                type="button"
                onClick={() => handleSectionToggle(section.title)}
                className={cn(sectionButtonClass(openSection === section.title), "justify-between")}
                aria-expanded={openSection === section.title}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Folder className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  <span className="truncate">{section.title}</span>
                </span>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform",
                    openSection === section.title && "rotate-90",
                  )}
                  aria-hidden
                />
              </button>
            )}
            {(collapsed || openSection === section.title) && (
              <div className="space-y-1">
                {section.title === "Settings" && (
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
                          isPathActive(item.path, item.activeMatch)
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
                          {invoiceNavItems
                            .filter((invoiceItem) => can(invoiceItem.pageKey))
                            .map((invoiceItem) => (
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
                        isPathActive(item.path, item.activeMatch)
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
            )}
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
