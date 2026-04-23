import { INVOICE_PAGE_ACCESS_KEYS, INVOICE_TYPE_TO_PAGE, PAGE } from "@/constants/page-access";
import type { InvoiceType } from "@/types/invoice";

function parseSearchParams(search: URLSearchParams | string | null | undefined): URLSearchParams {
  if (search == null) return new URLSearchParams();
  if (typeof search === "string") {
    const s = search.trim();
    if (!s) return new URLSearchParams();
    const q = s.startsWith("?") ? s.slice(1) : s;
    return new URLSearchParams(q);
  }
  return search;
}

/**
 * Returns page-access keys required for this pathname (OR semantics: user needs **any** listed key).
 * Pass `search` for `/invoices/new?type=…` so the correct invoice lane is enforced.
 */
export function getRequiredPermissions(
  pathname: string,
  search?: URLSearchParams | string | null,
): string[] | null {
  const p = (pathname.split("?")[0] ?? "").replace(/\/$/, "") || "/";
  const q = parseSearchParams(search);

  if (p.startsWith("/dashboard")) return [PAGE.dashboard];
  if (p.startsWith("/profile")) return [PAGE.profile];

  if (p.startsWith("/settings/role-groups/new")) return [PAGE.role_groups_manage];
  if (p.startsWith("/settings/role-groups")) return [PAGE.role_groups];
  if (p.startsWith("/settings")) return [PAGE.settings];

  if (p.startsWith("/team")) return [PAGE.team];
  if (p.startsWith("/audit-logs")) return [PAGE.audit_logs];

  if (p.startsWith("/invoices")) {
    if (p.startsWith("/invoices/sales-return")) return [PAGE.invoices_sales_return];
    if (p.startsWith("/invoices/purchase-return")) return [PAGE.invoices_purchase_return];
    if (p.startsWith("/invoices/sales")) return [PAGE.invoices_sales];
    if (p.startsWith("/invoices/purchases")) return [PAGE.invoices_purchases];

    if (p === "/invoices/new") {
      const type = q.get("type");
      if (type && type in INVOICE_TYPE_TO_PAGE) {
        return [INVOICE_TYPE_TO_PAGE[type as InvoiceType]];
      }
      return [...INVOICE_PAGE_ACCESS_KEYS];
    }

    if (p === "/invoices") return [...INVOICE_PAGE_ACCESS_KEYS];

    if (/^\/invoices\/\d+/.test(p)) return [...INVOICE_PAGE_ACCESS_KEYS];

    return [...INVOICE_PAGE_ACCESS_KEYS];
  }

  if (p.startsWith("/receipts")) return [PAGE.receipts];

  if (p.startsWith("/payments/outbound")) return [PAGE.payments_outbound];

  if (p.startsWith("/credit-notes")) return [PAGE.credit_notes];

  if (p.startsWith("/items")) return [PAGE.items];
  if (p.startsWith("/stock")) return [PAGE.stock];

  if (/^\/parties\/\d+\/ledger/.test(p)) return [PAGE.parties_ledger];
  if (p.startsWith("/parties")) return [PAGE.parties];

  if (/^\/vendors\/\d+\/ledger/.test(p)) return [PAGE.vendors_ledger];
  if (p.startsWith("/vendors")) return [PAGE.vendors];

  if (p.startsWith("/reports/invoice-register")) return [PAGE.reports_sales_register];
  if (p.startsWith("/reports/payables-register")) return [PAGE.reports_purchase_register];
  if (p.startsWith("/reports/receipt-register")) return [PAGE.reports_receipt_register];
  if (p.startsWith("/reports/item-register")) return [PAGE.reports_item_register];
  if (p.startsWith("/reports")) return [PAGE.reports];

  if (p.startsWith("/tax")) return [PAGE.tax];

  return null;
}
