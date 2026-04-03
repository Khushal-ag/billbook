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
import { toISODateString } from "@/lib/date";
import type { Party, PartyConsignee, PartyType } from "@/types/party";
import type { InvoiceType } from "@/types/invoice";

function formatConsigneeAddressLine(consignee: PartyConsignee): string {
  const cityState = [consignee.city, consignee.state].filter(Boolean).join(", ");
  return [consignee.address, cityState, consignee.postalCode].filter(Boolean).join(" · ");
}

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
  /** Purchase invoice: margin on purchase rate to suggest selling price per line. */
  sellingPriceMarginPercent?: string;
  onSellingPriceMarginChange?: (value: string) => void;
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
}: PartyAndDatesCardsProps) {
  const copy = getInvoiceTypeCreateCopy(invoiceType);
  const todayIso = toISODateString(new Date());
  const primaryAddressOptionLabel = "Primary Address";
  const primaryAddressLine =
    [party?.address, party?.city, party?.state, party?.postalCode].filter(Boolean).join(" · ") ||
    "No address";
  const selectedConsignee = consignees.find((c) => c.id === selectedConsigneeId) ?? null;
  const selectedTitle = selectedConsignee
    ? selectedConsignee.label?.trim() || selectedConsignee.consigneeName
    : primaryAddressOptionLabel;
  const selectedAddressLine = selectedConsignee
    ? formatConsigneeAddressLine(selectedConsignee)
    : primaryAddressLine;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.partyCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label required>{copy.partyLabel}</Label>
            <PartyAutocomplete
              value={party}
              onValueChange={onPartyChange}
              serverSearch
              partiesQueryType={partiesQueryType}
              placeholder={`Search ${copy.partyPlaceholder}...`}
              addLabel={copy.addPartyLabel}
              onAddParty={onAddParty}
            />
          </div>
          <div className="space-y-2">
            <Label>{addressRoleLabel}</Label>
            <Select
              value={
                party
                  ? selectedConsigneeId == null
                    ? "__PRIMARY__"
                    : String(selectedConsigneeId)
                  : undefined
              }
              onValueChange={(value) =>
                onConsigneeChange(value === "__PRIMARY__" ? null : Number(value))
              }
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
                    <SelectValue placeholder="Select party first" />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
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
                        {formatConsigneeAddressLine(c) || "No address"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
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
            <DateField label="Invoice Date" value={invoiceDate} onChange={onInvoiceDateChange} />
            <DateField
              label="Due Date"
              value={dueDate}
              onChange={onDueDateChange}
              minDate={todayIso}
            />
          </div>
          {invoiceType === "PURCHASE_INVOICE" &&
            sellingPriceMarginPercent !== undefined &&
            onSellingPriceMarginChange && (
              <div className="space-y-2">
                <Label htmlFor="selling-price-margin">
                  Selling price margin (%)
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    — applies to purchase rate on each line
                  </span>
                </Label>
                <Input
                  id="selling-price-margin"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 20"
                  value={sellingPriceMarginPercent}
                  onChange={(e) => onSellingPriceMarginChange(e.target.value)}
                  className="max-w-[12rem] tabular-nums"
                  autoComplete="off"
                />
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
