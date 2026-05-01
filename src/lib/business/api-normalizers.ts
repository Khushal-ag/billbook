import type { BusinessProfile } from "@/types/auth";
import type {
  DashboardData,
  DashboardRecentLedgerRow,
  SalesPurchaseByMonth,
  TopCustomer,
  TopVendor,
} from "@/types/dashboard";

export function normalizeDashboard(raw: Record<string, unknown>): DashboardData {
  const toTopCustomerList = (input: unknown): TopCustomer[] => {
    if (!Array.isArray(input)) return [];
    return input.map((row) => {
      const r = row as Record<string, unknown>;
      const totalRevenueRaw = r.totalRevenue;
      const totalReceivableRaw = r.totalReceivable ?? r.totalOutstanding;
      return {
        partyId: Number(r.partyId) || 0,
        partyName: typeof r.partyName === "string" ? r.partyName : "",
        totalReceivable:
          totalReceivableRaw != null
            ? (totalReceivableRaw as string | number)
            : totalRevenueRaw != null
              ? (totalRevenueRaw as string | number)
              : undefined,
        totalOutstanding:
          r.totalOutstanding != null ? (r.totalOutstanding as string | number) : undefined,
        totalRevenue: totalRevenueRaw != null ? (totalRevenueRaw as string | number) : undefined,
        invoiceCount: Number(r.invoiceCount) || 0,
      };
    });
  };

  const d = raw as unknown as DashboardData;

  const rawSp = (d as { salesVsPurchaseByMonth?: unknown }).salesVsPurchaseByMonth;
  const salesVsPurchaseByMonth: SalesPurchaseByMonth[] = Array.isArray(rawSp)
    ? rawSp.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          month: typeof r.month === "string" ? r.month : String(r.month ?? ""),
          sales: (r.sales ?? r.sale ?? 0) as string | number,
          purchase: (r.purchase ?? r.purchases ?? 0) as string | number,
        };
      })
    : [];

  const rawVendors = (d as { topVendors?: unknown }).topVendors;
  const topVendors: TopVendor[] = Array.isArray(rawVendors)
    ? rawVendors.map((v) => {
        const x = v as Record<string, unknown>;
        return {
          partyId: Number(x.partyId) || 0,
          partyName: typeof x.partyName === "string" ? x.partyName : "",
          totalPayable: (x.totalPayable ?? 0) as string | number,
          documentCount: typeof x.documentCount === "number" ? x.documentCount : undefined,
        };
      })
    : [];

  const rawLedger = (d as { recentLedgerActivity?: unknown }).recentLedgerActivity;
  const recentLedgerActivity: DashboardRecentLedgerRow[] = Array.isArray(rawLedger)
    ? rawLedger.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: r.id as string | number | undefined,
          occurredAt: typeof r.occurredAt === "string" ? r.occurredAt : String(r.occurredAt ?? ""),
          entryType:
            typeof r.entryType === "string"
              ? r.entryType
              : typeof r.type === "string"
                ? r.type
                : "UNKNOWN",
          partyName: typeof r.partyName === "string" ? r.partyName : String(r.partyName ?? ""),
          amount: (r.amount ?? r.totalAmount ?? 0) as string | number,
          mode: r.mode == null ? null : typeof r.mode === "string" ? r.mode : String(r.mode),
        };
      })
    : [];

  const rawStock = (d as { stockPulse?: unknown }).stockPulse;
  const stockPulse =
    rawStock != null && typeof rawStock === "object"
      ? {
          lowStockCount: Number((rawStock as { lowStockCount?: unknown }).lowStockCount) || 0,
          outOfStockCount: Number((rawStock as { outOfStockCount?: unknown }).outOfStockCount) || 0,
          deadStockCount: Number((rawStock as { deadStockCount?: unknown }).deadStockCount) || 0,
          fastMovingCount: Number((rawStock as { fastMovingCount?: unknown }).fastMovingCount) || 0,
        }
      : undefined;

  const topCustomers = toTopCustomerList(
    (d as { topCustomersByReceivable?: unknown }).topCustomersByReceivable,
  );

  return {
    ...d,
    todaySales: d.todaySales ?? 0,
    topCustomers,
    topCustomersByReceivable: topCustomers,
    totalReceivables: d.totalReceivables != null ? d.totalReceivables : undefined,
    salesVsPurchaseByMonth,
    topVendors,
    cashAndBankBalance: d.cashAndBankBalance,
    recentLedgerActivity,
    stockPulse,
  } as DashboardData;
}

export function normalizeBusinessProfile(raw: Record<string, unknown>): BusinessProfile {
  const r = raw as unknown as BusinessProfile & { address?: string; postalCode?: string };
  return {
    ...r,
    country: r.country ?? "India",
    street: r.street ?? r.address ?? null,
    area: r.area ?? null,
    pincode: r.pincode ?? r.postalCode ?? null,
    accountHolderName: r.accountHolderName ?? null,
    bankAccountNumber: r.bankAccountNumber ?? null,
    confirmAccountNumber: r.confirmAccountNumber ?? null,
    bankName: r.bankName ?? null,
    branchName: r.branchName ?? null,
    bankCity: r.bankCity ?? null,
    bankState: r.bankState ?? null,
    ifscCode: r.ifscCode ?? null,
    transferAmount: r.transferAmount ?? null,
    transferCurrency: r.transferCurrency ?? null,
    transferType: r.transferType ?? null,
    businessType: r.businessType ?? null,
    industryType: r.industryType ?? null,
    registrationType: r.registrationType ?? null,
    extraDetails: Array.isArray(r.extraDetails) ? r.extraDetails : null,
    financialYearStart: typeof r.financialYearStart === "number" ? r.financialYearStart : 4,
    validityEnd: (r as { validityEnd?: string | null }).validityEnd ?? null,
    profileCompletion: r.profileCompletion ?? undefined,
  } as BusinessProfile;
}
