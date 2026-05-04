"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/hooks/use-business-settings";
import { usePermissions } from "@/hooks/use-permissions";
import { P } from "@/constants/permissions";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import type {
  BusinessSettingsData,
  UpdateBusinessSettingsRequest,
} from "@/types/business-settings";

const MONTHS: { value: number; label: string }[] = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const TEMPLATE_THUMBNAIL_SOURCE_WIDTH = 794;
const TEMPLATE_THUMBNAIL_SOURCE_HEIGHT = 1120;
const TEMPLATE_THUMBNAIL_SCALE = 0.2;

function monthName(m: number): string {
  return MONTHS.find((x) => x.value === m)?.label ?? String(m);
}

type FormState = {
  invoicePrefix: string;
  invoiceSequenceStart: string;
  saleReturnPrefix: string;
  saleReturnSequenceStart: string;
  purchaseInvoicePrefix: string;
  purchaseInvoiceSequenceStart: string;
  purchaseReturnPrefix: string;
  purchaseReturnSequenceStart: string;
  receiptPrefix: string;
  receiptSequenceStart: string;
  paymentPrefix: string;
  paymentSequenceStart: string;
  defaultDueDays: string;
  /** Purchase: default margin % when lines omit selling price (decimal string, empty = clear). */
  defaultSellingPriceMarginPercent: string;
  fyMode: "profile" | string;
};

function toFormState(d: BusinessSettingsData): FormState {
  return {
    invoicePrefix: d.invoicePrefix,
    invoiceSequenceStart: String(d.invoiceSequenceStart),
    saleReturnPrefix: d.saleReturnPrefix,
    saleReturnSequenceStart: String(d.saleReturnSequenceStart),
    purchaseInvoicePrefix: d.purchaseInvoicePrefix,
    purchaseInvoiceSequenceStart: String(d.purchaseInvoiceSequenceStart),
    purchaseReturnPrefix: d.purchaseReturnPrefix,
    purchaseReturnSequenceStart: String(d.purchaseReturnSequenceStart),
    receiptPrefix: d.receiptPrefix,
    receiptSequenceStart: String(d.receiptSequenceStart),
    paymentPrefix: d.paymentPrefix,
    paymentSequenceStart: String(d.paymentSequenceStart),
    defaultDueDays: d.defaultDueDays == null ? "" : String(d.defaultDueDays),
    defaultSellingPriceMarginPercent: d.defaultSellingPriceMarginPercent?.trim() ?? "",
    fyMode:
      d.financialYearStartMonthSource === "business_profile"
        ? "profile"
        : String(d.financialYearStartMonth),
  };
}

const FORM_KEYS: (keyof FormState)[] = [
  "invoicePrefix",
  "invoiceSequenceStart",
  "saleReturnPrefix",
  "saleReturnSequenceStart",
  "purchaseInvoicePrefix",
  "purchaseInvoiceSequenceStart",
  "purchaseReturnPrefix",
  "purchaseReturnSequenceStart",
  "receiptPrefix",
  "receiptSequenceStart",
  "paymentPrefix",
  "paymentSequenceStart",
  "defaultDueDays",
  "defaultSellingPriceMarginPercent",
  "fyMode",
];

function buildPayload(f: FormState): UpdateBusinessSettingsRequest {
  const trimOrNull = (s: string) => {
    const t = s.trim();
    return t === "" ? null : t;
  };
  const seq = (s: string): number | null => {
    const t = s.trim();
    if (t === "") return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  };
  const due = f.defaultDueDays.trim();
  let defaultDueDays: number | null = null;
  if (due !== "") {
    const n = parseInt(due, 10);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("Due days must be a non-negative number.");
    }
    defaultDueDays = n;
  }
  const marginRaw = f.defaultSellingPriceMarginPercent.trim();
  let defaultSellingPriceMarginPercent: string | null;
  if (marginRaw === "") {
    defaultSellingPriceMarginPercent = null;
  } else {
    const n = Number(marginRaw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("Default selling margin (%) must be a non-negative number.");
    }
    defaultSellingPriceMarginPercent = marginRaw;
  }
  return {
    invoicePrefix: trimOrNull(f.invoicePrefix),
    invoiceSequenceStart: seq(f.invoiceSequenceStart),
    saleReturnPrefix: trimOrNull(f.saleReturnPrefix),
    saleReturnSequenceStart: seq(f.saleReturnSequenceStart),
    purchaseInvoicePrefix: trimOrNull(f.purchaseInvoicePrefix),
    purchaseInvoiceSequenceStart: seq(f.purchaseInvoiceSequenceStart),
    purchaseReturnPrefix: trimOrNull(f.purchaseReturnPrefix),
    purchaseReturnSequenceStart: seq(f.purchaseReturnSequenceStart),
    receiptPrefix: trimOrNull(f.receiptPrefix),
    receiptSequenceStart: seq(f.receiptSequenceStart),
    paymentPrefix: trimOrNull(f.paymentPrefix),
    paymentSequenceStart: seq(f.paymentSequenceStart),
    defaultDueDays,
    defaultSellingPriceMarginPercent,
    financialYearStartMonth: f.fyMode === "profile" ? null : parseInt(f.fyMode, 10),
  };
}

interface DocumentNumberingCardProps {
  /** When true, render without outer Card (for use inside Business settings panel). */
  embedded?: boolean;
}

export function DocumentNumberingCard({ embedded = false }: DocumentNumberingCardProps) {
  const { can } = usePermissions();
  const { data, isPending, error } = useBusinessSettings();
  const update = useUpdateBusinessSettings();
  const [patch, setPatch] = useState<Partial<FormState>>({});
  const [templateUpdateTarget, setTemplateUpdateTarget] = useState<number | "default" | null>(null);
  const [templatePreviewHtmlById, setTemplatePreviewHtmlById] = useState<Record<number, string>>(
    {},
  );
  const [templatePreviewModal, setTemplatePreviewModal] = useState<{
    title: string;
    html: string;
  } | null>(null);
  const templateOptions = useMemo(
    () => data?.invoiceTemplateOptions ?? [],
    [data?.invoiceTemplateOptions],
  );

  const onSave = async () => {
    if (!data) return;
    const f = { ...toFormState(data), ...patch };
    try {
      const body = buildPayload(f);
      await update.mutateAsync(body);
      setPatch({});
      showSuccessToast("Business settings saved");
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes("Due days") || e.message.includes("Default selling margin"))
      ) {
        showErrorToast(e.message);
        return;
      }
      showErrorToast(e, "Couldn't save settings");
    }
  };

  const onReset = () => setPatch({});
  const selectInvoiceTemplate = async (invoiceTemplateVersionId: number | null) => {
    setTemplateUpdateTarget(invoiceTemplateVersionId ?? "default");
    try {
      await update.mutateAsync({ invoiceTemplateVersionId });
      showSuccessToast(
        invoiceTemplateVersionId == null
          ? "Invoice template reset to platform default"
          : "Invoice template updated",
      );
    } catch (e) {
      showErrorToast(e, "Could not update invoice template");
    } finally {
      setTemplateUpdateTarget(null);
    }
  };

  useEffect(() => {
    const templateEntries = templateOptions
      .map((option) => ({
        id: option.invoiceTemplateVersionId ?? option.templateVersionId ?? null,
        previewUrl: option.previewUrl,
      }))
      .filter(
        (entry): entry is { id: number; previewUrl: string } =>
          entry.id != null && typeof entry.previewUrl === "string" && entry.previewUrl.length > 0,
      );
    if (templateEntries.length === 0) {
      setTemplatePreviewHtmlById((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const controller = new AbortController();
    const loadPreviews = async () => {
      const htmlPairs = await Promise.all(
        templateEntries.map(async ({ id, previewUrl }) => {
          try {
            const res = await fetch(previewUrl, { signal: controller.signal });
            if (!res.ok) return [id, null] as const;
            const html = await res.text();
            return [id, html] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (controller.signal.aborted) return;
      const next: Record<number, string> = {};
      for (const [id, html] of htmlPairs) {
        if (html) next[id] = html;
      }
      setTemplatePreviewHtmlById(next);
    };
    void loadPreviews();
    return () => controller.abort();
  }, [templateOptions]);

  const headerBlock = embedded ? (
    <div className="mb-6">
      <h3 className="text-base font-semibold tracking-tight">Document numbering</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage prefixes and starting numbers for sale and purchase documents, plus default invoice
        settings.
      </p>
    </div>
  ) : null;

  if (isPending || !data) {
    const skeleton = (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
    if (embedded) {
      return (
        <div>
          {headerBlock}
          {skeleton}
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document numbering</CardTitle>
          <CardDescription>Business settings — prefixes, sequences, and defaults</CardDescription>
        </CardHeader>
        <CardContent>{skeleton}</CardContent>
      </Card>
    );
  }

  if (error) {
    const err = (
      <p className="text-sm text-destructive">Could not load business settings from the server.</p>
    );
    if (embedded) {
      return (
        <div>
          {headerBlock}
          {err}
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document numbering</CardTitle>
          <CardDescription>Business settings</CardDescription>
        </CardHeader>
        <CardContent>{err}</CardContent>
      </Card>
    );
  }

  const currentTemplateVersionId =
    data.selectedInvoiceTemplateVersionId ?? data.effectiveInvoiceTemplateVersionId ?? null;
  const form = { ...toFormState(data), ...patch };
  const readOnly = !can(P.business.settings.update);
  const profileMonth = data.businessProfileFinancialYearStart;
  const changedCount = Object.keys(patch).length;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const base = toFormState(data);
    const full = { ...base, ...patch, [key]: value };
    const newPatch: Partial<FormState> = {};
    for (const k of FORM_KEYS) {
      if (full[k] !== base[k]) {
        newPatch[k] = full[k];
      }
    }
    setPatch(newPatch);
  };

  const fieldClass = readOnly ? "bg-muted/50" : "";

  const body = (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/70 bg-muted/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Settings overview</p>
          {readOnly ? (
            <Badge variant="secondary" className="font-normal">
              View only
            </Badge>
          ) : changedCount > 0 ? (
            <Badge variant="secondary" className="font-normal">
              {changedCount} unsaved {changedCount === 1 ? "change" : "changes"}
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal">
              All changes saved
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Update prefixes and sequence starts carefully. Changes apply to new documents.
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm">Duplicate numbers</AlertTitle>
        <AlertDescription className="text-xs">
          If you set a starting number lower than already-used numbers in this financial year, you
          may create duplicate document numbers. Please review carefully before saving.
        </AlertDescription>
      </Alert>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Invoice template</h4>
          {data.selectedInvoiceTemplateVersionId != null ? (
            <Badge variant="secondary" className="font-normal">
              Custom template selected
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal">
              Using platform default
            </Badge>
          )}
        </div>
        {templateOptions.length > 0 ? (
          <div
            className="-mx-1 snap-x snap-mandatory overflow-x-auto overflow-y-visible scroll-smooth px-1 pb-2 pt-0.5 [scrollbar-gutter:stable] sm:snap-none"
            aria-label="Available invoice templates"
          >
            <div className="flex w-max min-w-full gap-3">
              {templateOptions.map((option) => {
                const optionVersionId =
                  option.invoiceTemplateVersionId ?? option.templateVersionId ?? null;
                if (optionVersionId == null) return null;
                const isCurrent = currentTemplateVersionId === optionVersionId;
                const isExplicitPick = data.selectedInvoiceTemplateVersionId === optionVersionId;
                const isSaving = templateUpdateTarget === optionVersionId;
                const optionLabel =
                  option.displayName?.trim() ||
                  option.name?.trim() ||
                  option.templateName?.trim() ||
                  "Invoice template";
                const previewHtml = templatePreviewHtmlById[optionVersionId] ?? null;
                return (
                  <button
                    key={optionVersionId}
                    type="button"
                    disabled={readOnly || isSaving || update.isPending}
                    onClick={() => void selectInvoiceTemplate(optionVersionId)}
                    className={`group w-[min(280px,calc(100vw-2.5rem))] shrink-0 snap-start overflow-hidden rounded-xl border bg-card text-left transition-all sm:w-[240px] lg:w-[260px] ${
                      isCurrent
                        ? "border-primary shadow-sm ring-2 ring-primary/25"
                        : "border-border/80 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                    } ${readOnly ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <div className="relative aspect-square w-full border-b border-border/70 bg-muted/30">
                      {previewHtml ? (
                        <div className="flex h-full items-center justify-center p-2">
                          <div
                            className="pointer-events-none overflow-hidden rounded border border-border/60 bg-background shadow-sm"
                            style={{
                              width: `${Math.floor(TEMPLATE_THUMBNAIL_SOURCE_WIDTH * TEMPLATE_THUMBNAIL_SCALE)}px`,
                              height: `${Math.floor(TEMPLATE_THUMBNAIL_SOURCE_HEIGHT * TEMPLATE_THUMBNAIL_SCALE)}px`,
                            }}
                          >
                            <iframe
                              title={`${optionLabel} preview`}
                              srcDoc={previewHtml}
                              className="origin-top-left"
                              style={{
                                width: `${TEMPLATE_THUMBNAIL_SOURCE_WIDTH}px`,
                                height: `${TEMPLATE_THUMBNAIL_SOURCE_HEIGHT}px`,
                                transform: `scale(${TEMPLATE_THUMBNAIL_SCALE})`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                          {option.previewUrl ? "Loading preview..." : "Preview unavailable"}
                        </div>
                      )}
                      {previewHtml ? (
                        <span
                          role="button"
                          tabIndex={readOnly ? -1 : 0}
                          className="absolute bottom-2 right-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-border/70 bg-background/90 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (readOnly) return;
                            setTemplatePreviewModal({ title: optionLabel, html: previewHtml });
                          }}
                          onKeyDown={(e) => {
                            if (readOnly) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              setTemplatePreviewModal({ title: optionLabel, html: previewHtml });
                            }
                          }}
                          aria-label={`Open ${optionLabel} preview`}
                          aria-disabled={readOnly}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 px-2.5 pb-2 pt-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold leading-tight">
                            {optionLabel}
                          </p>
                        </div>
                        {isCurrent ? (
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                      {isExplicitPick || (isCurrent && !isExplicitPick) || isSaving ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {isExplicitPick ? (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              Selected
                            </Badge>
                          ) : null}
                          {isCurrent && !isExplicitPick ? (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Active default
                            </Badge>
                          ) : null}
                          {isSaving ? (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Saving...
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No invoice templates available yet.</p>
        )}
        {!readOnly ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={update.isPending || templateUpdateTarget === "default"}
              onClick={() => void selectInvoiceTemplate(null)}
            >
              {templateUpdateTarget === "default" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Use platform default template
            </Button>
          </div>
        ) : null}
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Sale invoices</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              className={fieldClass}
              maxLength={20}
              value={form.invoicePrefix}
              onChange={(e) => setField("invoicePrefix", e.target.value)}
              disabled={readOnly}
              placeholder="INV"
            />
            <p className="text-xs text-muted-foreground">Empty saves as default (INV).</p>
          </div>
          <div className="space-y-2">
            <Label>Sequence start (new FY)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={form.invoiceSequenceStart}
              onChange={(e) => setField("invoiceSequenceStart", e.target.value)}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">Clear to use 1.</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Sale returns</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              className={fieldClass}
              maxLength={20}
              value={form.saleReturnPrefix}
              onChange={(e) => setField("saleReturnPrefix", e.target.value)}
              disabled={readOnly}
              placeholder="SR"
            />
            <p className="text-xs text-muted-foreground">Empty uses server default.</p>
          </div>
          <div className="space-y-2">
            <Label>Sequence start (new FY)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={form.saleReturnSequenceStart}
              onChange={(e) => setField("saleReturnSequenceStart", e.target.value)}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">Clear to use 1.</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Purchase invoices</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              className={fieldClass}
              maxLength={20}
              value={form.purchaseInvoicePrefix}
              onChange={(e) => setField("purchaseInvoicePrefix", e.target.value)}
              disabled={readOnly}
              placeholder="PINV"
            />
            <p className="text-xs text-muted-foreground">Empty uses server default.</p>
          </div>
          <div className="space-y-2">
            <Label>Sequence start (new FY)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={form.purchaseInvoiceSequenceStart}
              onChange={(e) => setField("purchaseInvoiceSequenceStart", e.target.value)}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">Clear to use 1.</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Purchase returns</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              className={fieldClass}
              maxLength={20}
              value={form.purchaseReturnPrefix}
              onChange={(e) => setField("purchaseReturnPrefix", e.target.value)}
              disabled={readOnly}
              placeholder="PR"
            />
            <p className="text-xs text-muted-foreground">Empty uses server default.</p>
          </div>
          <div className="space-y-2">
            <Label>Sequence start (new FY)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={form.purchaseReturnSequenceStart}
              onChange={(e) => setField("purchaseReturnSequenceStart", e.target.value)}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">Clear to use 1.</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Receipts</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              className={fieldClass}
              maxLength={20}
              value={form.receiptPrefix}
              onChange={(e) => setField("receiptPrefix", e.target.value)}
              disabled={readOnly}
              placeholder="REC"
            />
          </div>
          <div className="space-y-2">
            <Label>Sequence start (new FY)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={form.receiptSequenceStart}
              onChange={(e) => setField("receiptSequenceStart", e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Payout vouchers</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Prefix</Label>
            <Input
              className={fieldClass}
              maxLength={20}
              value={form.paymentPrefix}
              onChange={(e) => setField("paymentPrefix", e.target.value)}
              disabled={readOnly}
              placeholder="PAY"
            />
          </div>
          <div className="space-y-2">
            <Label>Sequence start (new FY)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={1}
              value={form.paymentSequenceStart}
              onChange={(e) => setField("paymentSequenceStart", e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-3 text-sm font-semibold">Defaults</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Default due days (new invoices)</Label>
            <Input
              className={fieldClass}
              type="number"
              min={0}
              placeholder="Off"
              value={form.defaultDueDays}
              onChange={(e) => setField("defaultDueDays", e.target.value)}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">
              If set, drafts without a due date get invoice date + N days. Empty = off.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Default selling margin (%)</Label>
            <Input
              className={fieldClass}
              type="text"
              inputMode="decimal"
              placeholder="e.g. 20"
              value={form.defaultSellingPriceMarginPercent}
              onChange={(e) => setField("defaultSellingPriceMarginPercent", e.target.value)}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">
              Applied when a purchase line has no selling price: selling = cost + margin%. Empty
              clears the default (server uses no auto margin from settings).
            </p>
          </div>
          <div className="space-y-2">
            <Label>Financial year starts in</Label>
            <Select
              value={form.fyMode}
              onValueChange={(v) => setField("fyMode", v)}
              disabled={readOnly}
            >
              <SelectTrigger className={fieldClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">
                  Use business profile ({monthName(profileMonth)})
                </SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label} (override)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Profile FY month is <strong>{monthName(profileMonth)}</strong>. Override here for
              document numbering only, or change FY in business profile for broader use.
            </p>
          </div>
        </div>
      </div>

      {data.financialYearStartMonthSource === "business_profile" && (
        <p className="text-xs text-muted-foreground">
          Active FY month for numbering: <strong>{monthName(data.financialYearStartMonth)}</strong>{" "}
          (from business profile).
        </p>
      )}
      {data.financialYearStartMonthSource === "business_settings" && (
        <p className="text-xs text-muted-foreground">
          FY month for numbering is <strong>overridden</strong> here (
          {monthName(data.financialYearStartMonth)}).
        </p>
      )}

      {readOnly ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Only the business <strong>owner</strong> can change document numbering.
        </p>
      ) : (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={update.isPending || changedCount === 0}
          >
            Discard edits
          </Button>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={update.isPending || changedCount === 0}
          >
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
          {changedCount > 0 && !update.isPending ? (
            <span className="text-xs text-muted-foreground">
              {changedCount} pending {changedCount === 1 ? "edit" : "edits"}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );

  const previewDialog = (
    <Dialog
      open={templatePreviewModal != null}
      onOpenChange={(open) => !open && setTemplatePreviewModal(null)}
    >
      <DialogContent className="max-w-[min(96vw,1100px)]">
        <DialogHeader>
          <DialogTitle>{templatePreviewModal?.title ?? "Template preview"}</DialogTitle>
        </DialogHeader>
        {templatePreviewModal ? (
          <div className="overflow-hidden rounded-md border border-border/70 bg-background">
            <iframe
              title={`${templatePreviewModal.title} large preview`}
              srcDoc={templatePreviewModal.html}
              className="h-[78vh] min-h-[540px] w-full"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  if (embedded) {
    return (
      <div>
        {headerBlock}
        {body}
        {previewDialog}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Document numbering</CardTitle>
        <CardDescription>
          Business settings — prefixes, sequences, financial year, and default due days for
          invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {body}
        {previewDialog}
      </CardContent>
    </Card>
  );
}
