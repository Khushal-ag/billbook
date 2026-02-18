import { useState, useCallback } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import InvoiceDialog from "@/components/dialogs/InvoiceDialog";
import { InvoiceFilters, InvoicesTable } from "@/components/invoices/InvoiceSections";
import { useInvoices } from "@/hooks/use-invoices";
import { useDebounce } from "@/hooks/use-debounce";

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 20;

  const { data, isPending, error } = useInvoices({
    page,
    pageSize,
    status: statusFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const invoices = data?.invoices ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / pageSize) || 1;
  const total = data?.count ?? 0;

  const filtered = debouncedSearch
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (inv.partyName ?? "").toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : invoices;

  const handleStatusChange = useCallback((v: string) => {
    setStatusFilter(v);
    setPage(1);
  }, []);

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
    setPage(1);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
    setPage(1);
  }, []);

  const handleDialogOpen = useCallback(() => {
    setDialogOpen(true);
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Invoices"
        description="Manage and track all your invoices"
        action={
          <Button onClick={handleDialogOpen}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        }
      />

      <InvoiceFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={handleStatusChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load invoices" />

      {isPending ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No invoices found"
          description="Create your first invoice to get started with billing."
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          }
        />
      ) : (
        <>
          <InvoicesTable invoices={filtered} />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <InvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
