import { useState } from "react";
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
import TableSkeleton from "@/components/TableSkeleton";
import { useInvoices } from "@/hooks/use-invoices";

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useInvoices({
    page,
    pageSize,
    status: statusFilter,
  });

  // Fallback demo data for when API isn't connected
  const invoices = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const filtered = search
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
          inv.partyName.toLowerCase().includes(search.toLowerCase()),
      )
    : invoices;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Invoices"
        description="Manage and track all your invoices"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search invoices..."
          className="flex-1"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="FINAL">Final</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load invoices" />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No invoices found"
          description="Create your first invoice to get started with billing."
          action={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          }
        />
      ) : (
        <>
          <div className="data-table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-6 py-3">
                    Invoice #
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Party
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Date
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-3">
                    Due Date
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-3">
                    Amount
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-3">
                    Balance Due
                  </th>
                  <th className="text-center font-medium text-muted-foreground px-3 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{inv.partyName}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {inv.invoiceDate}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {inv.dueDate}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      ₹{inv.totalAmount}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      ₹{inv.balanceDue}
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
    </div>
  );
}
