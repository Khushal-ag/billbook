"use client";

import Link from "next/link";
import { BusinessIdentity } from "../BusinessIdentity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import ItemDialog from "@/components/dialogs/ItemDialog";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { useInvoiceCreateState } from "@/hooks/invoices/useInvoiceCreateState";
import { PartyAndDatesCards } from "@/components/invoices/invoice-create/PartyAndDatesCards";
import { LineEditorSection } from "@/components/invoices/invoice-create/LineEditorSection";
import { InvoiceTotalsSummary } from "@/components/invoices/invoice-create/InvoiceTotalsSummary";
import { ResizableNotesSummaryRow } from "@/components/invoices/invoice-create/ResizableNotesSummaryRow";
import { useBusinessProfile } from "@/hooks/use-business";
import type { InvoiceType } from "@/types/invoice";

interface InvoiceCreatePageProps {
  initialType: InvoiceType;
  initialSourceInvoiceId?: number;
}

export function InvoiceCreatePage({ initialType, initialSourceInvoiceId }: InvoiceCreatePageProps) {
  const state = useInvoiceCreateState(initialType, initialSourceInvoiceId);
  const copy = state.createCopy;
  const { data: businessProfile } = useBusinessProfile();

  return (
    <div className="page-container max-w-[96rem] animate-fade-in space-y-5">
      <PageHeader
        title={`Create ${state.pageMeta.label}`}
        description={copy.pageDescription}
        action={
          <Button variant="outline" asChild>
            <Link href={state.pageMeta.path}>Back to List</Link>
          </Button>
        }
      />

      {(state.isNextInvoiceNumberPending || state.nextInvoiceNumber) && (
        <div className="flex items-center gap-4">
          <BusinessIdentity
            name={businessProfile?.name}
            logoUrl={businessProfile?.logoUrl}
            size="md"
            showName={!businessProfile?.logoUrl}
            nameClassName="text-sm font-semibold text-foreground"
          />
          {state.isNextInvoiceNumberPending ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h2 className="text-2xl font-bold tracking-tight">{state.nextInvoiceNumber}</h2>
          )}
        </div>
      )}

      <ErrorBanner error={state.stockEntriesError} fallbackMessage={copy.loadErrorMessage} />

      <PartyAndDatesCards
        invoiceType={initialType}
        party={state.party}
        onPartyChange={state.setParty}
        parties={state.parties}
        onAddParty={state.handleOpenAddParty}
        invoiceDate={state.invoiceDate}
        onInvoiceDateChange={state.setInvoiceDate}
        dueDate={state.dueDate}
        onDueDateChange={state.setDueDate}
      />

      <LineEditorSection
        invoiceType={initialType}
        draftLine={state.draftLine}
        addedLines={state.addedLines}
        stockSearchOpen={state.stockSearchOpen}
        setStockSearchOpen={state.setStockSearchOpen}
        stockSearchText={state.stockSearchText}
        setStockSearchText={state.setStockSearchText}
        stockEntries={state.stockEntries}
        filteredStockChoices={state.filteredStockChoices}
        itemsWithoutStockOptions={state.itemsWithoutStockOptions}
        showAddItemOption={state.showAddItemOption}
        onSelectChoice={state.handleStockChoiceSelect}
        onAddStockForItem={state.handleAddStockForItem}
        onAddNewItem={state.handleAddItemClick}
        onLineQuantityChange={state.handleLineQuantityChange}
        onLineDiscountChange={state.handleLineDiscountChange}
        onLineDiscountAmountChange={state.handleLineDiscountAmountChange}
        addCurrentLine={state.addCurrentLine}
        removeAddedLine={state.removeAddedLine}
        applySuggestedQtyForLine={state.applySuggestedQtyForLine}
        stockLineIssues={state.stockLineIssues}
        focusedIssueLineId={state.focusedIssueLineId}
        qtyAutoAdjusted={state.qtyAutoAdjusted}
      />

      <ResizableNotesSummaryRow
        notes={
          <div className="ml-1 mt-4 w-full space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={state.notes}
              onChange={(e) => state.setNotes(e.target.value)}
              rows={4}
              className="min-h-[100px] w-full resize-y bg-background"
              placeholder="Terms, bank details, or other remarks…"
            />
          </div>
        }
        summary={
          <InvoiceTotalsSummary
            summaryTitle={copy.summaryTitle}
            summary={state.summary}
            autoRoundOff={state.autoRoundOff}
            onAutoRoundOffChange={(checked) => {
              state.setAutoRoundOff(checked);
              if (!checked && state.roundOffAmount.trim() === "0") {
                state.setRoundOffAmount("");
              }
            }}
            roundOffInputValue={state.roundOffInputValue}
            onRoundOffAmountChange={state.setRoundOffAmount}
            canSubmit={state.canSubmit}
            isPending={state.createInvoice.isPending}
            onCreate={state.handleCreate}
            shortLabel={state.pageMeta.shortLabel}
          />
        }
      />

      <PartyDialog
        open={state.addPartyDialogOpen}
        onOpenChange={(open) => {
          state.setAddPartyDialogOpen(open);
          if (!open) state.setPendingPartyName("");
        }}
        defaultType={state.partyType}
        typeLocked
        initialName={state.pendingPartyName}
        onSuccess={state.handlePartyCreated}
      />

      <ItemDialog
        open={state.addItemDialogOpen}
        onOpenChange={(open) => {
          state.setAddItemDialogOpen(open);
          if (!open) state.setPendingItemName("");
        }}
        initialName={state.pendingItemName}
        onSuccess={state.handleItemCreated}
      />
    </div>
  );
}
