import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE", "FINALIZE", "CANCEL"] as const;

interface AuditLogFiltersProps {
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
}

export function AuditLogFilters({ actionFilter, onActionFilterChange }: AuditLogFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <Select value={actionFilter} onValueChange={onActionFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Actions</SelectItem>
          {AUDIT_ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
