"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { showErrorToast, showSuccessToast } from "@/lib/toast-helpers";
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
      showErrorToast(e, "Could not save settings");
    }
  };

  const onReset = () => setPatch({});

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

  if (embedded) {
    return (
      <div>
        {headerBlock}
        {body}
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
      <CardContent>{body}</CardContent>
    </Card>
  );
}
