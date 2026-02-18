import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchInput from "@/components/SearchInput";
import DateRangePicker from "@/components/DateRangePicker";

interface InvoiceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: InvoiceFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(0,160px)] items-end gap-3 lg:grid-cols-[minmax(0,1fr)_160px_auto]">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search invoices..."
        className="col-span-1 w-full"
      />
      <div className="col-span-1 w-full">
        <Select value={status} onValueChange={onStatusChange}>
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
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />
    </div>
  );
}
