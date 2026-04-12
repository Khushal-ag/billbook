"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateField } from "@/components/invoices/invoice-create/DateField";
import { Input } from "@/components/ui/input";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { getInvoiceTypeCreateCopy } from "@/lib/invoice";
import {
  formatConsigneeAddressInline,
  formatPartyAddressInline,
} from "@/lib/party-address-display";
import { toISODateString } from "@/lib/date";
import type { Party, PartyConsignee, PartyType } from "@/types/party";
import { isPurchaseVendorBillMetaType } from "@/lib/invoice";
import { cn } from "@/lib/utils";
import type { InvoiceType } from "@/types/invoice";

interface PartyAndDatesCardsProps {
  invoiceType: InvoiceType;
  party: Party | null;
  onPartyChange: (party: Party | null) => void;
  consignees: PartyConsignee[];
  selectedConsigneeId: number | null;
  onConsigneeChange: (id: number | null) => void;
  isConsigneesLoading?: boolean;
  addressRoleLabel?: string;
  partiesQueryType: PartyType;
  onAddParty: (onCreated: (party: Party) => void, draftName?: string) => void;
  invoiceDate: string;
  onInvoiceDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  /** Purchase invoice / purchase return: margin % on cost (required). */
  sellingPriceMarginPercent?: string;
  onSellingPriceMarginChange?: (value: string) => void;
  /** Vendor bill metadata (purchase invoice only). */
  originalBillNumber?: string;
  onOriginalBillNumberChange?: (value: string) => void;
  originalBillDate?: string;
  onOriginalBillDateChange?: (value: string) => void;
  paymentTermsDays?: string;
  onPaymentTermsDaysChange?: (value: string) => void;
  /** Inline validation under party search. */
  partyErrorText?: string | null;
  /** Inline validation under selling margin (purchase types). */
  sellingMarginErrorText?: string | null;
}

export function PartyAndDatesCards({
  invoiceType,
  party,
  onPartyChange,
  consignees,
  selectedConsigneeId,
  onConsigneeChange,
  isConsigneesLoading = false,
  addressRoleLabel = "Delivery Address",
  partiesQueryType,
  onAddParty,
  invoiceDate,
  onInvoiceDateChange,
  dueDate,
  onDueDateChange,
  sellingPriceMarginPercent,
  onSellingPriceMarginChange,
  originalBillNumber,
  onOriginalBillNumberChange,
  originalBillDate,
  onOriginalBillDateChange,
  paymentTermsDays,
  onPaymentTermsDaysChange,
  partyErrorText,
  sellingMarginErrorText,
}: PartyAndDatesCardsProps) {
  const copy = getInvoiceTypeCreateCopy(invoiceType);
  const todayIso = toISODateString(new Date());
  const showVendorBillFields =
    isPurchaseVendorBillMetaType(invoiceType) &&
    originalBillNumber !== undefined &&
    onOriginalBillNumberChange &&
    originalBillDate !== undefined &&
    onOriginalBillDateChange &&
    paymentTermsDays !== undefined &&
    onPaymentTermsDaysChange;
  const invoiceDateLabel = "Invoice date";
  const showSellingPriceMargin =
    invoiceType === "PURCHASE_INVOICE" &&
    sellingPriceMarginPercent !== undefined &&
    onSellingPriceMarginChange;
  const primaryAddressOptionLabel = "Primary Address";
  const primaryAddressLine = formatPartyAddressInline(party) || "No address";
  /** Keeps Radix Select controlled before party loads (`undefined` would flip uncontrolled → controlled). */
  const NO_PARTY_VALUE = "__NO_PARTY__";
  const consigneeSelectValue = !party
    ? NO_PARTY_VALUE
    : selectedConsigneeId == null
      ? "__PRIMARY__"
      : String(selectedConsigneeId);
  const selectedConsignee = consignees.find((c) => c.id === selectedConsigneeId) ?? null;
  const selectedTitle = selectedConsignee
    ? selectedConsignee.label?.trim() || selectedConsignee.consigneeName
    : primaryAddressOptionLabel;
  const selectedAddressLine = selectedConsignee
    ? formatConsigneeAddressInline(selectedConsignee)
    : primaryAddressLine;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.partyCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div id="invoice-create-party-field" className="space-y-2">
            <Label required>{copy.partyLabel}</Label>
            <PartyAutocomplete
              value={party}
              onValueChange={onPartyChange}
              serverSearch
              partiesQueryType={partiesQueryType}
              placeholder={`Search ${copy.partyPlaceholder}...`}
              addLabel={copy.addPartyLabel}
              onAddParty={onAddParty}
              inputId="invoice-create-party-input"
              errorText={partyErrorText}
            />
          </div>
          <div className="space-y-2">
            <Label>{addressRoleLabel}</Label>
            <Select
              value={consigneeSelectValue}
              onValueChange={(value) => {
                if (value === NO_PARTY_VALUE) return;
                onConsigneeChange(value === "__PRIMARY__" ? null : Number(value));
              }}
              disabled={!party || isConsigneesLoading}
            >
              <SelectTrigger className="h-auto min-h-10 items-start py-2 [&>span]:line-clamp-none">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left leading-tight">
                  {party ? (
                    <>
                      <span className="truncate text-sm font-medium">{selectedTitle}</span>
                      {selectedAddressLine ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {selectedAddressLine}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <SelectValue placeholder={`Select ${copy.partyLabel.toLowerCase()} first`} />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                {!party ? (
                  <SelectItem value={NO_PARTY_VALUE} disabled>
                    {`Select ${copy.partyLabel.toLowerCase()} first`}
                  </SelectItem>
                ) : (
                  <>
                    <SelectItem value="__PRIMARY__">
                      <div className="flex flex-col">
                        <span>{primaryAddressOptionLabel}</span>
                        <span className="text-xs opacity-80">{primaryAddressLine}</span>
                      </div>
                    </SelectItem>
                    {consignees.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <div className="flex flex-col">
                          <span>{c.label?.trim() || c.consigneeName}</span>
                          <span className="text-xs opacity-80">
                            {formatConsigneeAddressInline(c) || "No address"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.detailsCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label={invoiceDateLabel}
              value={invoiceDate}
              onChange={onInvoiceDateChange}
              required
            />
            <DateField
              label="Due Date"
              value={dueDate}
              onChange={onDueDateChange}
              minDate={todayIso}
            />
          </div>
          {showVendorBillFields && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="original-bill-no" required>
                  Original bill no.
                </Label>
                <Input
                  id="original-bill-no"
                  type="text"
                  maxLength={100}
                  value={originalBillNumber}
                  onChange={(e) => onOriginalBillNumberChange(e.target.value)}
                  placeholder="Vendor’s bill number"
                  autoComplete="off"
                />
              </div>
              <DateField
                label="Original bill date"
                value={originalBillDate}
                onChange={onOriginalBillDateChange}
                maxDate={todayIso}
                required
              />
            </div>
          )}
          {(showVendorBillFields || showSellingPriceMargin) && (
            <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
              {showVendorBillFields && (
                <Label
                  htmlFor="payment-terms-days"
                  className={cn("leading-snug", !showSellingPriceMargin && "sm:col-span-2")}
                >
                  Payment terms (days)
                </Label>
              )}
              {showSellingPriceMargin && (
                <Label htmlFor="selling-price-margin" className="leading-snug" required>
                  Selling margin (%)
                </Label>
              )}
              {showVendorBillFields && (
                <Input
                  id="payment-terms-days"
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 30"
                  value={paymentTermsDays}
                  onChange={(e) => onPaymentTermsDaysChange(e.target.value)}
                  className={cn("tabular-nums", !showSellingPriceMargin && "sm:col-span-2")}
                  autoComplete="off"
                />
              )}
              {showSellingPriceMargin && (
                <div className="space-y-1.5">
                  <Input
                    id="selling-price-margin"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 20"
                    value={sellingPriceMarginPercent}
                    onChange={(e) => onSellingPriceMarginChange(e.target.value)}
                    aria-invalid={Boolean(sellingMarginErrorText)}
                    aria-describedby={
                      sellingMarginErrorText ? "selling-price-margin-error" : undefined
                    }
                    className={cn(
                      "tabular-nums",
                      sellingMarginErrorText &&
                        "border-destructive focus-visible:ring-destructive/40",
                    )}
                    autoComplete="off"
                  />
                  {sellingMarginErrorText ? (
                    <p
                      id="selling-price-margin-error"
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {sellingMarginErrorText}
                    </p>
                  ) : null}
                </div>
              )}
              {showSellingPriceMargin && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Required. Prefilled from business settings when a default is saved. Used when a
                  line has no selling price; after save, the invoice shows the effective margin.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
