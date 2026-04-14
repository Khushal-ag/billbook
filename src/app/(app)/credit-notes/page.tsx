"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import TablePagination from "@/components/TablePagination";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import CreditNoteDialog from "@/components/dialogs/CreditNoteDialog";
import { CreditNotesTable } from "@/components/credit-notes/CreditNoteSections";
import { useCreditNotes } from "@/hooks/use-credit-notes";
import { usePagination } from "@/hooks/use-pagination";
import { useCanCreateInvoice } from "@/hooks/use-can-create-invoice";
import { BusinessProfileGateAlert } from "@/components/business/BusinessProfileGateAlert";

const PAGE_SIZE = 20;

export default function CreditNotes() {
  const router = useRouter();
  const { page, setPage } = usePagination();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isPending, error } = useCreditNotes({ page, pageSize: PAGE_SIZE });
  const { canCreateInvoice, businessProfile } = useCanCreateInvoice();
  const allowNewCreditNote = canCreateInvoice === true;

  const creditNotes = data?.creditNotes ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleView = (id: number) => {
    router.push(`/credit-notes/${id}`);
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Credit Notes"
        description="Issue credit notes for final sale invoices or sales returns. The customer’s account is updated right away; open a note when you want to apply it to unpaid bills."
        action={
          allowNewCreditNote ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Credit Note
            </Button>
          ) : (
            <Button type="button" disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Credit Note
            </Button>
          )
        }
      />

      {canCreateInvoice === false ? (
        <div className="mb-4">
          <BusinessProfileGateAlert businessProfile={businessProfile} context="credit-notes" />
        </div>
      ) : null}

      <ErrorBanner error={error} fallbackMessage="Failed to load credit notes" />

      {isPending ? (
        <TableSkeleton rows={3} />
      ) : creditNotes.length === 0 ? (
        <EmptyState
          icon={<FileMinus className="h-5 w-5" />}
          title="No credit notes"
          description="Create a credit note from a final sale invoice or sales return, then open it to allocate to the customer’s open sale invoices if needed."
          action={
            allowNewCreditNote ? (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Credit Note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <CreditNotesTable creditNotes={creditNotes} onView={handleView} />
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <CreditNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
