import { useState } from "react";
import { Plus, FileMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import CreditNoteDialog from "@/components/dialogs/CreditNoteDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  CreditNotesTable,
  CreditNoteDetailSheet,
} from "@/components/credit-notes/CreditNoteSections";
import {
  useCreditNotes,
  useFinalizeCreditNote,
  useDeleteCreditNote,
} from "@/hooks/use-credit-notes";
import { usePermissions } from "@/hooks/use-permissions";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function CreditNotes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedCreditNoteId, setSelectedCreditNoteId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const { data, isPending, error } = useCreditNotes();
  const finalizeMutation = useFinalizeCreditNote();
  const deleteMutation = useDeleteCreditNote();
  const { isOwner } = usePermissions();

  const creditNotes = data?.creditNotes ?? [];

  const handleFinalize = async (id: number) => {
    try {
      await finalizeMutation.mutateAsync(id);
      showSuccessToast("Credit note finalized");
    } catch (err) {
      showErrorToast(err, "Failed to finalize");
    }
  };

  const handleDelete = (id: number) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      showSuccessToast("Credit note deleted");
      setDeleteConfirm({ open: false, id: null });
      setDetailSheetOpen(false);
      setSelectedCreditNoteId(null);
    } catch (err) {
      showErrorToast(err, "Failed to delete");
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleView = (id: number) => {
    setSelectedCreditNoteId(id);
    setDetailSheetOpen(true);
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Credit Notes"
        description="Issue and manage credit notes against finalized invoices"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Credit Note
          </Button>
        }
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load credit notes" />

      {isPending ? (
        <TableSkeleton rows={3} />
      ) : creditNotes.length === 0 ? (
        <EmptyState
          icon={<FileMinus className="h-5 w-5" />}
          title="No credit notes"
          description="Credit notes will appear here once created against finalized invoices."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Credit Note
            </Button>
          }
        />
      ) : (
        <CreditNotesTable
          creditNotes={creditNotes}
          isOwner={isOwner}
          finalizePending={finalizeMutation.isPending}
          deletePending={deleteMutation.isPending}
          onView={handleView}
          onFinalize={handleFinalize}
          onDelete={handleDelete}
        />
      )}

      <CreditNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <CreditNoteDetailSheet
        creditNoteId={selectedCreditNoteId}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) setSelectedCreditNoteId(null);
        }}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: deleteConfirm.id })}
        onConfirm={confirmDelete}
        title="Delete Credit Note"
        description="Are you sure you want to delete this credit note? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
