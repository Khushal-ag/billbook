import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchInput from "@/components/SearchInput";
import DateRangePicker from "@/components/DateRangePicker";
import type { Party } from "@/types/party";

interface InvoiceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Defaults to "Search invoices..." */
  searchPlaceholder?: string;
  parties?: Party[];
  partyId?: number;
  onPartyChange?: (partyId?: number) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function InvoiceFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Search invoices...",
  parties = [],
  partyId,
  onPartyChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: InvoiceFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(0,200px)] items-end gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto]">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="col-span-1 w-full"
      />
      <div className="col-span-1 w-full">
        <Select
          value={partyId != null ? String(partyId) : "ALL"}
          onValueChange={(v) => onPartyChange?.(v === "ALL" ? undefined : Number(v))}
          disabled={!onPartyChange}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Party" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Parties</SelectItem>
            {parties.map((party) => (
              <SelectItem key={party.id} value={String(party.id)}>
                {party.name}
              </SelectItem>
            ))}
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
