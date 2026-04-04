"use client";

import Link from "next/link";
import { BusinessIdentity } from "../BusinessIdentity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import ItemDialog from "@/components/dialogs/ItemDialog";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { useInvoiceCreateState } from "@/hooks/invoices";
import { PartyAndDatesCards } from "@/components/invoices/invoice-create/PartyAndDatesCards";
import { LineEditorSection } from "@/components/invoices/invoice-create/LineEditorSection";
import { InvoiceTotalsSummary } from "@/components/invoices/invoice-create/InvoiceTotalsSummary";
import { ResizableNotesSummaryRow } from "@/components/invoices/invoice-create/ResizableNotesSummaryRow";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessProfile } from "@/hooks/use-business";
import { isPurchaseVendorBillMetaType } from "@/lib/invoice";
import type { InvoiceType } from "@/types/invoice";

interface InvoiceCreatePageProps {
  initialType: InvoiceType;
  initialSourceInvoiceId?: number;
  /** When set, full create UI edits this draft (PUT) instead of creating. */
  editInvoiceId?: number;
}

export function InvoiceCreatePage({
  initialType,
  initialSourceInvoiceId,
  editInvoiceId,
}: InvoiceCreatePageProps) {
  const state = useInvoiceCreateState(initialType, {
    sourceInvoiceId: initialSourceInvoiceId,
    editInvoiceId,
  });
  const copy = state.createCopy;
  const { data: businessProfile } = useBusinessProfile();
  const showNumberRow =
    state.isEditMode || state.isNextInvoiceNumberPending || Boolean(state.nextInvoiceNumber);
  const displayNumber = state.isEditMode ? state.editingInvoiceNumber : state.nextInvoiceNumber;
  const numberPending = state.isEditMode
    ? state.isEditingInvoiceLoading
    : state.isNextInvoiceNumberPending;
  const showPurchaseBillNoLabel = isPurchaseVendorBillMetaType(initialType);

  return (
    <div className="page-container max-w-[96rem] animate-fade-in space-y-5">
      <PageHeader
        title={state.isEditMode ? `Edit ${state.pageMeta.label}` : `Create ${state.pageMeta.label}`}
        description={
          state.isEditMode
            ? "Update party, dates, lines, and totals. Save applies changes to this draft."
            : copy.pageDescription
        }
        action={
          <div className="flex flex-wrap gap-2">
            {state.isEditMode && editInvoiceId ? (
              <Button variant="outline" asChild>
                <Link href={`/invoices/${editInvoiceId}`}>Back to invoice</Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link href={state.pageMeta.path}>Back to List</Link>
            </Button>
          </div>
        }
      />

      {showNumberRow && (
        <div className="flex items-center gap-4">
          <BusinessIdentity
            name={businessProfile?.name}
            logoUrl={businessProfile?.logoUrl}
            size="md"
            showName={!businessProfile?.logoUrl}
            nameClassName="text-sm font-semibold text-foreground"
          />
          <div>
            {showPurchaseBillNoLabel ? (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Purchase bill no.
              </p>
            ) : null}
            {numberPending ? (
              <Skeleton className="mt-1 h-8 w-48" />
            ) : (
              <h2 className="text-2xl font-bold tracking-tight">{displayNumber}</h2>
            )}
          </div>
        </div>
      )}

      <ErrorBanner error={state.stockEntriesError} fallbackMessage={copy.loadErrorMessage} />

      <PartyAndDatesCards
        invoiceType={initialType}
        party={state.party}
        onPartyChange={state.setParty}
        consignees={state.consignees}
        selectedConsigneeId={state.selectedConsigneeId}
        onConsigneeChange={state.setSelectedConsigneeId}
        isConsigneesLoading={state.isConsigneesLoading}
        addressRoleLabel={state.addressRoleLabel}
        partiesQueryType={state.partyType}
        onAddParty={state.handleOpenAddParty}
        invoiceDate={state.invoiceDate}
        onInvoiceDateChange={state.setInvoiceDate}
        dueDate={state.dueDate}
        onDueDateChange={state.setDueDate}
        sellingPriceMarginPercent={
          initialType === "PURCHASE_INVOICE" ? state.sellingPriceMarginPercent : undefined
        }
        onSellingPriceMarginChange={
          initialType === "PURCHASE_INVOICE" ? state.handleSellingPriceMarginChange : undefined
        }
        originalBillNumber={
          isPurchaseVendorBillMetaType(initialType) ? state.originalBillNumber : undefined
        }
        onOriginalBillNumberChange={
          isPurchaseVendorBillMetaType(initialType) ? state.setOriginalBillNumber : undefined
        }
        originalBillDate={
          isPurchaseVendorBillMetaType(initialType) ? state.originalBillDate : undefined
        }
        onOriginalBillDateChange={
          isPurchaseVendorBillMetaType(initialType) ? state.setOriginalBillDate : undefined
        }
        paymentTermsDays={
          isPurchaseVendorBillMetaType(initialType) ? state.paymentTermsDays : undefined
        }
        onPaymentTermsDaysChange={
          isPurchaseVendorBillMetaType(initialType) ? state.setPaymentTermsDays : undefined
        }
      />

      <LineEditorSection
        returnValidationWarning={state.returnQtyBlockReason}
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
        updateLine={state.updateLine}
        addCurrentLine={state.addCurrentLine}
        removeAddedLine={state.removeAddedLine}
        applySuggestedQtyForLine={state.applySuggestedQtyForLine}
        stockLineIssues={state.stockLineIssues}
        focusedIssueLineId={state.focusedIssueLineId}
        qtyAutoAdjusted={state.qtyAutoAdjusted}
        unitPriceFloorWarning={state.unitPriceFloorWarning}
        unitPriceFloorIsError={state.unitPriceFloorIsError}
        onPurchaseUnitPriceChange={
          initialType === "PURCHASE_INVOICE" || initialType === "PURCHASE_RETURN"
            ? state.handlePurchaseUnitPriceChange
            : undefined
        }
        onSalesUnitPriceChange={
          initialType === "SALE_INVOICE" ? state.handleSalesUnitPriceChange : undefined
        }
        onSalesUnitPriceBlur={
          initialType === "SALE_INVOICE" ? state.handleSalesUnitPriceBlur : undefined
        }
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
            variant={initialType === "SALE_RETURN" ? "returnTotal" : "default"}
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
            submitBlockedHint={state.returnQtySubmitShortHint}
            isPending={state.saveInvoice.isPending}
            onCreate={state.handleCreate}
            shortLabel={state.pageMeta.shortLabel}
            submitLabel={state.isEditMode ? `Save ${state.pageMeta.shortLabel}` : undefined}
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
