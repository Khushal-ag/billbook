"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateField } from "@/components/invoices/invoice-create/DateField";
import { PartyAutocomplete } from "@/components/invoices/PartyAutocomplete";
import { getInvoiceTypeCreateCopy } from "@/lib/invoice";
import type { Party, PartyType } from "@/types/party";
import type { InvoiceType } from "@/types/invoice";

interface PartyAndDatesCardsProps {
  invoiceType: InvoiceType;
  party: Party | null;
  onPartyChange: (party: Party | null) => void;
  partiesQueryType: PartyType;
  onAddParty: (onCreated: (party: Party) => void, draftName?: string) => void;
  invoiceDate: string;
  onInvoiceDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
}

export function PartyAndDatesCards({
  invoiceType,
  party,
  onPartyChange,
  partiesQueryType,
  onAddParty,
  invoiceDate,
  onInvoiceDateChange,
  dueDate,
  onDueDateChange,
}: PartyAndDatesCardsProps) {
  const copy = getInvoiceTypeCreateCopy(invoiceType);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.partyCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{copy.partyLabel} *</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{copy.detailsCardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <DateField label="Invoice Date" value={invoiceDate} onChange={onInvoiceDateChange} />
          <DateField label="Due Date" value={dueDate} onChange={onDueDateChange} />
        </CardContent>
      </Card>
    </div>
  );
}
