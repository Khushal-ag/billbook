import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import TablePagination from "@/components/TablePagination";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import InvoiceDialog from "@/components/dialogs/InvoiceDialog";
import DateRangePicker from "@/components/DateRangePicker";
import { useInvoices } from "@/hooks/use-invoices";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate } from "@/lib/utils";

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

      {/* Filters */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(0,160px)] items-end gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search invoices..."
          className="col-span-1 w-full"
        />
        <div className="col-span-1 w-full">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="FINAL">Final</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DateRangePicker
          className="col-span-2 lg:col-span-1"
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      </div>

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
          <div className="data-table-container">
            <table className="w-full text-sm" role="table" aria-label="Invoices list">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-medium text-muted-foreground sm:px-6"
                  >
                    Invoice #
                  </th>
                  <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                    Party
                  </th>
                  <th
                    scope="col"
                    className="hidden px-3 py-3 text-left font-medium text-muted-foreground sm:table-cell"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="hidden px-3 py-3 text-left font-medium text-muted-foreground md:table-cell"
                  >
                    Due Date
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right font-medium text-muted-foreground"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="hidden px-3 py-3 text-right font-medium text-muted-foreground md:table-cell"
                  >
                    Balance Due
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center font-medium text-muted-foreground"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 sm:px-6">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{inv.partyName ?? "—"}</td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                      <div className="flex flex-col">
                        <span>{formatDate(inv.dueDate)}</span>
                        {inv.isOverdue && inv.overdueDays !== undefined && inv.overdueDays > 0 && (
                          <span className="text-xs text-destructive">
                            Overdue {inv.overdueDays}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatCurrency(inv.totalAmount ?? "0")}
                    </td>
                    <td className="hidden px-3 py-3 text-right font-medium md:table-cell">
                      {formatCurrency(
                        inv.dueAmount ??
                          parseFloat((inv.totalAmount ?? "0").replace(/,/g, "")) -
                            parseFloat((inv.paidAmount ?? "0").replace(/,/g, "")),
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
