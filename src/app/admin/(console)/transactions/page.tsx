"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ListOrdered, Loader2 } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import DateRangePicker from "@/components/DateRangePicker";
import { ReportLimitInput } from "@/components/reports/ReportLimitInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminTransactions } from "@/hooks/use-admin-transactions";
import { useDateRange } from "@/hooks/use-date-range";
import { MAX_REPORT_DATE_RANGE_MONTHS } from "@/constants";
import type { AdminTransactionRow } from "@/types/admin";
import { downloadCsvText, recordsToCsv } from "@/lib/data/records-csv";
import {
  APP_DISPLAY_LOCALE,
  appDisplayDateOnlyOptions,
  formatAppDateOnlyFromYmd,
  formatAppDateTimeFromIso,
} from "@/lib/core/date";
import { showErrorToast } from "@/lib/ui/toast-helpers";
import { cn, formatNumber, humanizeApiEnum } from "@/lib/core/utils";

/** CSV columns (subset of API; enough for support without internal ids in the sheet). */
const ADMIN_TRANSACTION_CSV_COLUMNS = [
  "createdAt",
  "organizationCode",
  "businessName",
  "businessId",
  "kind",
  "amount",
  "partyName",
  "invoiceNumber",
  "referenceType",
  "referenceId",
  "paymentMethod",
  "paymentCategory",
  "referenceNumber",
  "notes",
] as const;

const DEFAULT_PAGE_LIMIT = 100;

function emptyDash(value: string | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === "") return "—";
  return String(value);
}

function paymentSummary(row: AdminTransactionRow): string {
  const parts: string[] = [];
  if (row.paymentMethod?.trim()) parts.push(humanizeApiEnum(row.paymentMethod));
  if (row.paymentCategory?.trim()) parts.push(humanizeApiEnum(row.paymentCategory));
  if (row.referenceNumber?.trim()) parts.push(row.referenceNumber.trim());
  return parts.length ? parts.join(" · ") : "—";
}

function kindBadgeClass(kind: string): string {
  switch (kind) {
    case "RECEIPT":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100";
    case "SALE_INVOICE":
    case "SALE_RETURN":
      return "border-sky-500/35 bg-sky-500/10 text-sky-950 dark:text-sky-100";
    case "PURCHASE_INVOICE":
    case "PURCHASE_RETURN":
      return "border-violet-500/35 bg-violet-500/10 text-violet-950 dark:text-violet-100";
    case "OPENING_BALANCE":
      return "border-border bg-muted/60 text-muted-foreground";
    case "OUTBOUND_PAYMENT":
      return "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100";
    default:
      return "border-border bg-background text-foreground";
  }
}

function KindBadge({ kind }: { kind: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("max-w-full truncate text-xs font-medium", kindBadgeClass(kind))}
      title={kind}
    >
      {humanizeApiEnum(kind)}
    </Badge>
  );
}

export default function AdminTransactionsPage() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error: dateRangeError,
    validStartDate,
    validEndDate,
  } = useDateRange({ maxMonths: MAX_REPORT_DATE_RANGE_MONTHS });

  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [offset, setOffset] = useState(0);
  const [businessIdRaw, setBusinessIdRaw] = useState("");

  const businessIdParsed = useMemo(() => {
    const t = businessIdRaw.trim();
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : undefined;
  }, [businessIdRaw]);

  const businessIdFilterInvalid = businessIdRaw.trim() !== "" && businessIdParsed === undefined;

  const { data, isPending, error } = useAdminTransactions({
    startDate: validStartDate,
    endDate: validEndDate,
    limit,
    offset,
    businessId: businessIdParsed,
    queryEnabled: !businessIdFilterInvalid,
  });

  const transactions = data?.transactions;
  const rows = transactions ?? [];
  const total = data?.total ?? 0;
  const periodLabel = useMemo(() => {
    if (!data?.period) return null;
    return `${formatAppDateOnlyFromYmd(data.period.startDate)} → ${formatAppDateOnlyFromYmd(data.period.endDate)}`;
  }, [data?.period]);

  const errMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : "Failed to load transactions";
  }, [error]);

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const queryReady =
    Boolean(validStartDate && validEndDate) && !businessIdFilterInvalid && !errMessage;

  const onDownloadCsv = () => {
    if (rows.length === 0) return;
    try {
      const csv = recordsToCsv(
        rows as unknown as Record<string, unknown>[],
        ADMIN_TRANSACTION_CSV_COLUMNS,
      );
      const fname = `admin-transactions-${validStartDate}-${validEndDate}.csv`;
      downloadCsvText(csv, fname);
    } catch (e) {
      showErrorToast(e, "Couldn't build CSV");
    }
  };

  const showResultsStrip = queryReady && !isPending;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Transactions"
        description="Party ledger entries across organizations (invoices, receipts, payments, opening balances)."
      />

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-border/70 bg-gradient-to-br from-muted/45 via-muted/20 to-background px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Query
                </p>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                  Set the period and page size, optionally narrow to one business. Export downloads
                  exactly what is shown in the table.
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-9 w-full shrink-0 gap-2 shadow-sm sm:w-auto sm:self-start"
                disabled={rows.length === 0 || isPending || !queryReady}
                onClick={() => onDownloadCsv()}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-6 lg:grid-cols-12 lg:gap-4">
              <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm sm:col-span-2 lg:col-span-6 xl:col-span-5">
                <p className="mb-3 text-xs font-semibold text-foreground">Date range</p>
                <DateRangePicker
                  compact
                  startDate={startDate}
                  endDate={endDate}
                  displayLocale={APP_DISPLAY_LOCALE}
                  displayDateOptions={appDisplayDateOnlyOptions}
                  onStartDateChange={(d) => {
                    setStartDate(d);
                    setOffset(0);
                  }}
                  onEndDateChange={(d) => {
                    setEndDate(d);
                    setOffset(0);
                  }}
                  error={dateRangeError}
                />
              </div>

              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-6 xl:col-span-7">
                <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
                  <ReportLimitInput
                    stacked
                    id="admin-tx-limit"
                    value={limit}
                    onChange={(n) => {
                      setLimit(n);
                      setOffset(0);
                    }}
                  />
                </div>
                <div className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm">
                  <Label
                    htmlFor="admin-business-id"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Business ID <span className="font-normal opacity-70">(optional)</span>
                  </Label>
                  <Input
                    id="admin-business-id"
                    inputMode="numeric"
                    placeholder="All businesses"
                    value={businessIdRaw}
                    onChange={(e) => {
                      setBusinessIdRaw(e.target.value);
                      setOffset(0);
                    }}
                    className="mt-2 h-9 font-mono"
                  />
                  {businessIdFilterInvalid ? (
                    <p className="mt-1.5 text-xs text-destructive">
                      Use a positive whole number or leave blank.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <p className="mt-4 border-t border-border/50 pt-4 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
              Maximum range {MAX_REPORT_DATE_RANGE_MONTHS} months (same as other reports). CSV
              columns match the table; only rows loaded on this page are included.
            </p>
          </div>

          {showResultsStrip ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
              <Badge variant="secondary" className="font-mono text-xs font-medium tabular-nums">
                {total.toLocaleString()} {total === 1 ? "row" : "rows"}
              </Badge>
              {periodLabel ? (
                <>
                  <span className="select-none text-muted-foreground/50" aria-hidden>
                    ·
                  </span>
                  <span className="text-sm text-muted-foreground">{periodLabel}</span>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4 p-4 sm:p-6">
            {errMessage ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {errMessage}
              </div>
            ) : null}

            {!validStartDate || !validEndDate || businessIdFilterInvalid ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {!validStartDate || !validEndDate
                  ? `Choose a valid period (max ${MAX_REPORT_DATE_RANGE_MONTHS} months).`
                  : "Fix the business ID filter to load data."}
              </p>
            ) : isPending ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<ListOrdered className="h-8 w-8" />}
                title="No transactions"
                description="Try a wider date range or clear the business ID filter."
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border border-border/70">
                  <div className="max-h-[min(70vh,40rem)] overflow-y-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur-sm">
                          <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            When
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Org
                          </th>
                          <th className="min-w-[7rem] px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Business
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Kind
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                            Amount
                          </th>
                          <th className="min-w-[8rem] px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Party
                          </th>
                          <th className="min-w-[6.5rem] px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Invoice
                          </th>
                          <th className="min-w-[6rem] px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Payment
                          </th>
                          <th className="min-w-[6rem] max-w-[12rem] px-3 py-2.5 text-xs font-medium text-muted-foreground">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr
                            key={`${row.businessId}-${row.id}`}
                            className={cn(
                              "border-b border-border/50 last:border-0 hover:bg-muted/30",
                              row.kind === "OPENING_BALANCE" && "bg-muted/[0.25]",
                            )}
                          >
                            <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-muted-foreground">
                              {formatAppDateTimeFromIso(row.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 align-middle">
                              <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-xs">
                                {row.organizationCode}
                              </code>
                            </td>
                            <td className="max-w-[11rem] px-3 py-2 align-middle">
                              <span
                                className="line-clamp-2 text-foreground"
                                title={row.businessName}
                              >
                                {row.businessName}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-middle">
                              <KindBadge kind={row.kind} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right align-middle font-medium tabular-nums text-foreground">
                              {formatNumber(row.amount)}
                            </td>
                            <td className="max-w-[11rem] px-3 py-2 align-middle text-muted-foreground">
                              <span className="line-clamp-2" title={row.partyName}>
                                {row.partyName}
                              </span>
                            </td>
                            <td className="max-w-[9rem] px-3 py-2 align-middle font-mono text-xs text-foreground">
                              <span className="block truncate" title={emptyDash(row.invoiceNumber)}>
                                {emptyDash(row.invoiceNumber)}
                              </span>
                            </td>
                            <td className="max-w-[10rem] px-3 py-2 align-middle text-xs text-muted-foreground">
                              <span className="line-clamp-3" title={paymentSummary(row)}>
                                {paymentSummary(row)}
                              </span>
                            </td>
                            <td className="max-w-[12rem] px-3 py-2 align-middle text-xs text-muted-foreground">
                              <span className="line-clamp-3" title={emptyDash(row.notes)}>
                                {emptyDash(row.notes)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {total === 0 ? "0" : `${offset + 1}–${Math.min(offset + limit, total)}`} of{" "}
                    {total.toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canPrev}
                      onClick={() => setOffset((o) => Math.max(0, o - limit))}
                      className="gap-0.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canNext}
                      onClick={() => setOffset((o) => o + limit)}
                      className="gap-0.5"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
