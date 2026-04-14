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
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
import { CreditNotesTable } from "@/components/credit-notes/CreditNoteSections";
import { useCreditNotes, useDeleteCreditNote } from "@/hooks/use-credit-notes";
import { usePagination } from "@/hooks/use-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { useCanCreateInvoice } from "@/hooks/use-can-create-invoice";
import { BusinessProfileGateAlert } from "@/components/business/BusinessProfileGateAlert";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";
import { maybeShowTrialExpiredToast } from "@/lib/trial";
import { ApiClientError } from "@/api/error";

const PAGE_SIZE = 20;

export default function CreditNotes() {
  const router = useRouter();
  const { page, setPage } = usePagination();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const { data, isPending, error } = useCreditNotes({ page, pageSize: PAGE_SIZE });
  const deleteMutation = useDeleteCreditNote();
  const { isOwner } = usePermissions();
  const { canCreateInvoice, businessProfile } = useCanCreateInvoice();
  const allowNewCreditNote = canCreateInvoice === true;

  const creditNotes = data?.creditNotes ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleDelete = (id: number) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      showSuccessToast("Credit note deleted");
      setDeleteConfirm({ open: false, id: null });
    } catch (err) {
      if (maybeShowTrialExpiredToast(err)) return;
      if (err instanceof ApiClientError && err.status === 409) {
        showErrorToast(
          "This credit note still has amounts allocated to invoices. Open it, save an empty allocation list, then try again.",
          "Cannot delete yet",
        );
      } else {
        showErrorToast(err, "Failed to delete");
      }
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleView = (id: number) => {
    router.push(`/credit-notes/${id}`);
  };

  const deletePendingId =
    deleteMutation.isPending && deleteConfirm.id != null ? deleteConfirm.id : null;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Credit Notes"
        description="Issue credit notes against final sale invoices or sales returns. The customer ledger is credited immediately; open a note to allocate it to open sale invoices."
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
          <CreditNotesTable
            creditNotes={creditNotes}
            isOwner={isOwner}
            deletePendingId={deletePendingId}
            onView={handleView}
            onDelete={handleDelete}
          />
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

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ open, id: open ? prev.id : null }))}
        onConfirm={confirmDelete}
        title="Delete credit note"
        description="This removes the ledger credit and archives the credit note. You can only delete when nothing is allocated to customer invoices."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
