import { P } from "@/constants/permissions";

/**
 * Returns the permission key required to access this pathname, or null if no explicit guard.
 */
export function getRequiredPermission(pathname: string): string | null {
  const p = (pathname.split("?")[0] ?? "").replace(/\/$/, "") || "/";

  if (p.startsWith("/dashboard")) return P.business.dashboard.view;
  if (p.startsWith("/profile")) return P.business.profile.view;

  if (p.startsWith("/settings/role-groups/new")) return P.business.role_groups.manage;
  if (p.startsWith("/settings/role-groups")) return P.business.role_groups.view;
  if (p.startsWith("/settings")) return P.business.settings.view;

  if (p.startsWith("/team")) return P.business.team.view;
  if (p.startsWith("/audit-logs")) return P.audit.view;

  if (p.startsWith("/invoices/new")) return P.invoice.create;
  if (/^\/invoices\/\d+\/edit$/.test(p)) return P.invoice.update;
  if (p.startsWith("/invoices")) return P.invoice.view;

  if (p.startsWith("/receipts/new")) return P.receipt.create;
  if (p.startsWith("/receipts")) return P.receipt.view;

  if (p.startsWith("/payments/outbound/new")) return P.payment.outbound.create;
  if (p.startsWith("/payments/outbound")) return P.payment.outbound.view;

  if (p.startsWith("/credit-notes")) return P.credit_note.view;

  if (p.startsWith("/items")) return P.item.view;
  if (p.startsWith("/stock")) return P.item.stock.view;

  if (p.startsWith("/parties") || p.startsWith("/vendors")) return P.party.view;

  if (p.startsWith("/reports")) return P.reports.view;
  if (p.startsWith("/tax")) return P.tax.view;

  return null;
}
