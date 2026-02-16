import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import ErrorBanner from "./ErrorBanner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error?: string | null;
  className?: string;
}

function parseISODateString(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return undefined;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string): string {
  const dt = parseISODateString(value);
  if (!dt) return "";
  return dt.toLocaleDateString("en-GB");
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
  className,
}: DateRangePickerProps) {
  return (
    <>
      <div
        className={cn("grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-end", className)}
      >
        <div className="w-full sm:w-auto">
          <Label className="mb-1 block text-xs text-muted-foreground">From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-start gap-2 bg-background px-3 text-left font-normal hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground sm:w-[160px]",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{startDate ? formatDisplayDate(startDate) : "dd/mm/yyyy"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseISODateString(startDate)}
                onSelect={(date) => {
                  if (!date) return;
                  onStartDateChange(toISODateString(date));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-full sm:w-auto">
          <Label className="mb-1 block text-xs text-muted-foreground">To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-start gap-2 bg-background px-3 text-left font-normal hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground sm:w-[160px]",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{endDate ? formatDisplayDate(endDate) : "dd/mm/yyyy"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseISODateString(endDate)}
                onSelect={(date) => {
                  if (!date) return;
                  onEndDateChange(toISODateString(date));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {error && <ErrorBanner error={new Error(error)} />}
    </>
  );
}
