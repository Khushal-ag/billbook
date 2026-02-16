import { useState } from "react";
import { Plus, FileMinus, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import CreditNoteDialog from "@/components/dialogs/CreditNoteDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useCreditNotes,
  useFinalizeCreditNote,
  useDeleteCreditNote,
} from "@/hooks/use-credit-notes";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

export default function CreditNotes() {
  const [dialogOpen, setDialogOpen] = useState(false);
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
    } catch (err) {
      showErrorToast(err, "Failed to delete");
      setDeleteConfirm({ open: false, id: null });
    }
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
        <div className="data-table-container">
          <table className="w-full text-sm" role="table" aria-label="Credit notes list">
            <thead>
              <tr className="border-b bg-muted/30">
                <th scope="col" className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Credit Note #
                </th>
                <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                  Invoice ID
                </th>
                <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                  Reason
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">
                  Status
                </th>
                {isOwner && (
                  <th
                    scope="col"
                    className="px-3 py-3 text-center font-medium text-muted-foreground"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((cn) => (
                <tr
                  key={cn.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/20"
                >
                  <td className="px-6 py-3 font-medium">{cn.creditNoteNumber}</td>
                  <td className="px-3 py-3 text-accent">#{cn.invoiceId}</td>
                  <td className="max-w-[200px] truncate px-3 py-3 text-muted-foreground">
                    {cn.reason ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{formatCurrency(cn.amount)}</td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={cn.status} />
                  </td>
                  {isOwner && (
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {cn.status === "DRAFT" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFinalize(cn.id)}
                              disabled={finalizeMutation.isPending}
                              title="Finalize"
                              aria-label={`Finalize credit note ${cn.creditNoteNumber}`}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(cn.id)}
                              disabled={deleteMutation.isPending}
                              title="Delete"
                              aria-label={`Delete credit note ${cn.creditNoteNumber}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreditNoteDialog open={dialogOpen} onOpenChange={setDialogOpen} />

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
