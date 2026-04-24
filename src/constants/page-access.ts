import type { PermissionCatalogNode } from "@/types/role-group";
import type { InvoiceType } from "@/types/invoice";
import { P } from "@/constants/permissions";

/**
 * Page-wise access keys — align with app sidebar routes.
 * Backend should store these in role group `permissionKeys` and include them in `user.permissions` for staff.
 *
 * Full list (copy for backend / OpenAPI):
 * - page.dashboard
 * - page.items
 * - page.stock
 * - page.stock.overview
 * - page.stock.ledger
 * - page.parties
 * - page.parties.ledger
 * - page.vendors
 * - page.vendors.ledger
 * - page.invoices.sales
 * - page.invoices.purchases
 * - page.invoices.sales_return
 * - page.invoices.purchase_return
 * - page.receipts
 * - page.credit_notes
 * - page.payments_outbound
 * - page.reports
 * - page.reports.sales_register (Sales register)
 * - page.reports.purchase_register (Purchase register)
 * - page.reports.receipt_register (Receipt register)
 * - page.reports.debt_register (Debt register)
 * - page.reports.payables_register (Payables register)
 * - page.reports.item_register
 * - page.profile
 * - page.settings
 * - page.team
 * - page.role_groups
 * - page.role_groups_manage
 * - page.tax
 * - page.audit_logs
 *
 * Deprecated (still honored in `usePermissions`): `page.invoices` — treated as all four invoice lanes.
 */
export const PAGE = {
  dashboard: "page.dashboard",
  items: "page.items",
  stock: "page.stock",
  stock_overview: "page.stock.overview",
  stock_ledger: "page.stock.ledger",
  parties: "page.parties",
  parties_ledger: "page.parties.ledger",
  vendors: "page.vendors",
  vendors_ledger: "page.vendors.ledger",
  invoices_sales: "page.invoices.sales",
  invoices_purchases: "page.invoices.purchases",
  invoices_sales_return: "page.invoices.sales_return",
  invoices_purchase_return: "page.invoices.purchase_return",
  receipts: "page.receipts",
  credit_notes: "page.credit_notes",
  payments_outbound: "page.payments_outbound",
  reports: "page.reports",
  reports_sales_register: "page.reports.sales_register",
  reports_purchase_register: "page.reports.purchase_register",
  reports_payables_register: "page.reports.payables_register",
  reports_receipt_register: "page.reports.receipt_register",
  reports_debt_register: "page.reports.debt_register",
  reports_item_register: "page.reports.item_register",
  profile: "page.profile",
  settings: "page.settings",
  team: "page.team",
  role_groups: "page.role_groups",
  role_groups_manage: "page.role_groups_manage",
  tax: "page.tax",
  audit_logs: "page.audit_logs",
} as const;

export type PageAccessKey = (typeof PAGE)[keyof typeof PAGE];

/** Invoice list routes — one permission per sidebar line under Invoices. */
export const INVOICE_PAGE_ACCESS_KEYS = [
  PAGE.invoices_sales,
  PAGE.invoices_purchases,
  PAGE.invoices_sales_return,
  PAGE.invoices_purchase_return,
] as const satisfies readonly PageAccessKey[];

/** @deprecated Prefer the four `page.invoices.*` keys; still honored in `usePermissions` until data migrates. */
export const DEPRECATED_PAGE_INVOICES_UNIFIED = "page.invoices" as const;

export const INVOICE_TYPE_TO_PAGE: Record<InvoiceType, PageAccessKey> = {
  SALE_INVOICE: PAGE.invoices_sales,
  PURCHASE_INVOICE: PAGE.invoices_purchases,
  SALE_RETURN: PAGE.invoices_sales_return,
  PURCHASE_RETURN: PAGE.invoices_purchase_return,
};

/** All `page.*` keys — stable order for APIs and tests. */
export const ALL_PAGE_ACCESS_KEYS: PageAccessKey[] = [
  PAGE.dashboard,
  PAGE.items,
  PAGE.stock,
  PAGE.stock_overview,
  PAGE.stock_ledger,
  PAGE.parties,
  PAGE.parties_ledger,
  PAGE.vendors,
  PAGE.vendors_ledger,
  ...INVOICE_PAGE_ACCESS_KEYS,
  PAGE.receipts,
  PAGE.credit_notes,
  PAGE.payments_outbound,
  PAGE.reports,
  PAGE.reports_sales_register,
  PAGE.reports_purchase_register,
  PAGE.reports_receipt_register,
  PAGE.reports_debt_register,
  PAGE.reports_payables_register,
  PAGE.reports_item_register,
  PAGE.profile,
  PAGE.settings,
  PAGE.team,
  PAGE.role_groups,
  PAGE.role_groups_manage,
  PAGE.tax,
  PAGE.audit_logs,
];

const INVOICE_LEGACY_CAPS: readonly string[] = [
  P.invoice.view,
  P.invoice.create,
  P.invoice.update,
  P.invoice.finalize,
  P.invoice.cancel,
  P.invoice.payment.record,
  P.invoice.pdf,
  P.invoice.communication,
  P.payment.outbound.create,
  P.credit_note.create,
];

/**
 * When a user holds a page key, they are treated as having these legacy permission keys in the UI
 * (until the app is fully migrated off `P.*` checks).
 * Each invoice lane currently maps to the same capability set; the backend can narrow per-type later.
 */
export const PAGE_IMPLIES_LEGACY: Record<PageAccessKey, readonly string[]> = {
  [PAGE.dashboard]: [P.business.dashboard.view],
  [PAGE.items]: [P.item.view, P.item.create, P.item.update, P.item.delete, P.item.unit.manage],
  [PAGE.stock]: [
    P.item.stock.view,
    P.item.stock.manage,
    P.item.stock.summaryView,
    P.item.stock.ledgerView,
    P.item.adjust_stock,
    P.alerts.view,
    P.alerts.manage,
  ],
  [PAGE.stock_overview]: [P.item.stock.summaryView],
  [PAGE.stock_ledger]: [P.item.stock.ledgerView],
  [PAGE.parties]: [P.party.view],
  [PAGE.parties_ledger]: [P.party.ledger.view, P.party.ledger.customerView],
  [PAGE.vendors]: [P.party.view],
  [PAGE.vendors_ledger]: [P.party.ledger.view, P.party.ledger.vendorView],
  [PAGE.invoices_sales]: [...INVOICE_LEGACY_CAPS],
  [PAGE.invoices_purchases]: [...INVOICE_LEGACY_CAPS],
  [PAGE.invoices_sales_return]: [...INVOICE_LEGACY_CAPS],
  [PAGE.invoices_purchase_return]: [...INVOICE_LEGACY_CAPS],
  [PAGE.receipts]: [P.receipt.view, P.receipt.create, P.receipt.update_allocations, P.receipt.pdf],
  [PAGE.credit_notes]: [
    P.credit_note.view,
    P.credit_note.create,
    P.credit_note.update,
    P.credit_note.delete,
  ],
  [PAGE.payments_outbound]: [
    P.payment.outbound.view,
    P.payment.outbound.create,
    P.payment.outbound.pdf,
  ],
  [PAGE.reports]: [P.reports.view],
  [PAGE.reports_sales_register]: [P.reports.view],
  [PAGE.reports_purchase_register]: [P.reports.view],
  [PAGE.reports_payables_register]: [P.reports.view],
  [PAGE.reports_receipt_register]: [P.reports.view],
  [PAGE.reports_debt_register]: [P.reports.view],
  [PAGE.reports_item_register]: [P.reports.view],
  [PAGE.profile]: [
    P.business.profile.view,
    P.business.profile.update,
    P.business.settings.view,
    P.business.business_types.view,
    P.business.business_types.manage,
    P.business.industry_types.view,
    P.business.industry_types.manage,
  ],
  [PAGE.settings]: [P.business.settings.view, P.business.settings.update],
  [PAGE.team]: [P.business.team.view, P.business.team.invite, P.business.team.manage],
  [PAGE.role_groups]: [P.business.role_groups.view],
  /** Manage token only; view is injected in `usePermissions` expansion when this page is held. */
  [PAGE.role_groups_manage]: [P.business.role_groups.manage],
  [PAGE.tax]: [P.tax.view],
  [PAGE.audit_logs]: [P.audit.view],
};

/**
 * Broader page keys satisfy narrower `can(pageKey)` checks (e.g. manage includes view-only route).
 */
export const PAGE_IMPLIES_PAGE_KEYS: Partial<Record<PageAccessKey, readonly PageAccessKey[]>> = {
  [PAGE.role_groups_manage]: [PAGE.role_groups],
  [PAGE.stock]: [PAGE.stock_overview, PAGE.stock_ledger],
  /** Item register reuses stock summary cards (GET /items/stock summary). */
  [PAGE.reports_item_register]: [PAGE.stock_overview],
};

/** Catalog tree for role group editor — mirrors `AppSidebar` + team/roles block. */
export function buildPageAccessCatalog(): PermissionCatalogNode[] {
  return [
    {
      type: "folder",
      id: "pages-overview",
      label: "Overview",
      children: [{ type: "permission", key: PAGE.dashboard, label: "Dashboard" }],
    },
    {
      type: "folder",
      id: "pages-master",
      label: "Master",
      children: [
        { type: "permission", key: PAGE.items, label: "Items" },
        {
          type: "folder",
          id: "pages-master-stock",
          label: "Stock",
          children: [
            { type: "permission", key: PAGE.stock, label: "Stock" },
            {
              type: "permission",
              key: PAGE.stock_overview,
              label: "Stock overview (summary cards)",
            },
            {
              type: "permission",
              key: PAGE.stock_ledger,
              label: "Stock ledger (per-item movements)",
            },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "pages-parties",
      label: "Parties",
      children: [
        { type: "permission", key: PAGE.parties, label: "Customers" },
        { type: "permission", key: PAGE.parties_ledger, label: "Customer account ledger" },
        { type: "permission", key: PAGE.vendors, label: "Vendors" },
        { type: "permission", key: PAGE.vendors_ledger, label: "Vendor account ledger" },
      ],
    },
    {
      type: "folder",
      id: "pages-accounting",
      label: "Accounting",
      children: [
        {
          type: "folder",
          id: "pages-invoices",
          label: "Invoices",
          children: [
            { type: "permission", key: PAGE.invoices_sales, label: "Sales invoice" },
            { type: "permission", key: PAGE.invoices_purchases, label: "Purchase invoice" },
            { type: "permission", key: PAGE.invoices_sales_return, label: "Sales return" },
            { type: "permission", key: PAGE.invoices_purchase_return, label: "Purchase return" },
          ],
        },
        { type: "permission", key: PAGE.receipts, label: "Receipts" },
        { type: "permission", key: PAGE.credit_notes, label: "Credit notes" },
        { type: "permission", key: PAGE.payments_outbound, label: "Payments" },
      ],
    },
    {
      type: "folder",
      id: "pages-reports",
      label: "Reports",
      children: [
        { type: "permission", key: PAGE.reports, label: "Reports dashboard" },
        {
          type: "permission",
          key: PAGE.reports_sales_register,
          label: "Sales register",
        },
        {
          type: "permission",
          key: PAGE.reports_purchase_register,
          label: "Purchase register",
        },
        {
          type: "permission",
          key: PAGE.reports_receipt_register,
          label: "Receipt register",
        },
        {
          type: "permission",
          key: PAGE.reports_debt_register,
          label: "Debt register",
        },
        {
          type: "permission",
          key: PAGE.reports_payables_register,
          label: "Payables register",
        },
        { type: "permission", key: PAGE.reports_item_register, label: "Item register" },
      ],
    },
    {
      type: "folder",
      id: "pages-settings",
      label: "Settings",
      children: [
        { type: "permission", key: PAGE.profile, label: "Profile" },
        { type: "permission", key: PAGE.settings, label: "Business settings" },
        {
          type: "folder",
          id: "pages-team-roles",
          label: "Team & roles",
          children: [
            { type: "permission", key: PAGE.team, label: "Team members" },
            { type: "permission", key: PAGE.role_groups, label: "Role groups (view)" },
            {
              type: "permission",
              key: PAGE.role_groups_manage,
              label: "Role groups (create & edit)",
            },
          ],
        },
      ],
    },
    {
      type: "folder",
      id: "pages-more",
      label: "More",
      children: [
        { type: "permission", key: PAGE.tax, label: "Tax / GST" },
        { type: "permission", key: PAGE.audit_logs, label: "Audit logs" },
      ],
    },
  ];
}
