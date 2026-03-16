"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import ItemDialog from "@/components/dialogs/ItemDialog";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { useInvoiceCreateState } from "@/hooks/invoices/useInvoiceCreateState";
import { PartyAndDatesCards } from "@/components/invoices/invoice-create/PartyAndDatesCards";
import { LineEditorSection } from "@/components/invoices/invoice-create/LineEditorSection";
import { InvoiceTotalsSummary } from "@/components/invoices/invoice-create/InvoiceTotalsSummary";
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
          {businessProfile?.logoUrl && (
            <img
              src={businessProfile.logoUrl}
              alt="Company logo"
              className="h-12 w-auto max-w-[160px] rounded object-contain"
            />
          )}
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
        discountAmount={state.discountAmount}
        onDiscountAmountChange={state.setDiscountAmount}
        discountPercent={state.discountPercent}
        onDiscountPercentChange={state.setDiscountPercent}
        invoiceDate={state.invoiceDate}
        onInvoiceDateChange={state.setInvoiceDate}
        dueDate={state.dueDate}
        onDueDateChange={state.setDueDate}
        notes={state.notes}
        onNotesChange={state.setNotes}
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
        updateLine={state.updateLine}
        onLineDiscountChange={state.handleLineDiscountChange}
        addCurrentLine={state.addCurrentLine}
        removeAddedLine={state.removeAddedLine}
        applySuggestedQtyForLine={state.applySuggestedQtyForLine}
        stockLineIssues={state.stockLineIssues}
        focusedIssueLineId={state.focusedIssueLineId}
        qtyAutoAdjusted={state.qtyAutoAdjusted}
      />

      <InvoiceTotalsSummary
        summaryTitle={copy.summaryTitle}
        summary={state.summary}
        autoRoundOff={state.autoRoundOff}
        onAutoRoundOffChange={state.setAutoRoundOff}
        roundOffInputValue={state.roundOffInputValue}
        onRoundOffAmountChange={state.setRoundOffAmount}
        canSubmit={state.canSubmit}
        isPending={state.createInvoice.isPending}
        onCreate={state.handleCreate}
        shortLabel={state.pageMeta.shortLabel}
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
