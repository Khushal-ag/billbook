import { useState } from "react";
import { Plus, FileMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/TableSkeleton";
import { useCreditNotes } from "@/hooks/use-credit-notes";

export default function CreditNotes() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCreditNotes({ page });

  const creditNotes = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Credit Notes"
        description="Issue and manage credit notes against finalized invoices"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Credit Note
          </Button>
        }
      />

      <ErrorBanner
        error={error}
        fallbackMessage="Failed to load credit notes"
      />

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : creditNotes.length === 0 ? (
        <EmptyState
          icon={<FileMinus className="h-5 w-5" />}
          title="No credit notes"
          description="Credit notes will appear here once created against finalized invoices."
        />
      ) : (
        <>
          <div className="data-table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">
                    Credit Note #
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Invoice
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Party
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Reason
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-3">
                    Amount
                  </th>
                  <th className="text-center font-medium text-muted-foreground px-3 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((cn) => (
                  <tr
                    key={cn.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium">
                      {cn.creditNoteNumber}
                    </td>
                    <td className="px-3 py-3 text-accent">
                      {cn.invoiceNumber}
                    </td>
                    <td className="px-3 py-3">{cn.partyName}</td>
                    <td className="px-3 py-3 text-muted-foreground truncate max-w-[200px]">
                      {cn.reason}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      ₹{cn.amount}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={cn.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            pageSize={20}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
