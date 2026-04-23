import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import ErrorBanner from "./ErrorBanner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/core/utils";
import { parseISODateString, toISODateString, formatISODateDisplay } from "@/lib/core/date";

const DEFAULT_DISPLAY_LOCALE = "en-GB";
const DEFAULT_DISPLAY_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error?: string | null;
  className?: string;
  /** Tighter layout (e.g. reports hub): shorter controls, less vertical label space. */
  compact?: boolean;
  /** Locale for From/To button labels (default en-GB). */
  displayLocale?: string;
  /** Options for Intl date formatting on From/To (default short day month year). */
  displayDateOptions?: Intl.DateTimeFormatOptions;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
  className,
  compact = false,
  displayLocale = DEFAULT_DISPLAY_LOCALE,
  displayDateOptions = DEFAULT_DISPLAY_DATE_OPTIONS,
}: DateRangePickerProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const labelCls = compact
    ? "mb-0 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
    : "mb-1 block text-xs text-muted-foreground";

  const btnCls = compact
    ? "h-9 w-full justify-start gap-1.5 bg-background px-2.5 text-left text-sm font-normal hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground sm:w-[132px]"
    : "h-10 w-full justify-start gap-2 bg-background px-3 text-left font-normal hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground sm:w-[160px]";

  const iconCls = compact ? "h-3.5 w-3.5 text-muted-foreground" : "h-4 w-4 text-muted-foreground";

  return (
    <div className={cn("w-full min-w-0", compact && "max-w-full")}>
      <div
        className={cn(
          compact
            ? "flex w-full flex-wrap items-end gap-2 sm:gap-3"
            : "grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-end",
          className,
        )}
      >
        <div
          className={cn(
            "w-full sm:w-auto",
            compact && "flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial",
          )}
        >
          <Label className={labelCls}>From</Label>
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(btnCls, !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className={iconCls} />
                <span>
                  {startDate
                    ? formatISODateDisplay(startDate, displayLocale, displayDateOptions)
                    : "dd/mm/yyyy"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseISODateString(startDate)}
                onSelect={(date) => {
                  if (!date) return;
                  onStartDateChange(toISODateString(date));
                  setFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div
          className={cn(
            "w-full sm:w-auto",
            compact && "flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial",
          )}
        >
          <Label className={labelCls}>To</Label>
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(btnCls, !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className={iconCls} />
                <span>
                  {endDate
                    ? formatISODateDisplay(endDate, displayLocale, displayDateOptions)
                    : "dd/mm/yyyy"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseISODateString(endDate)}
                onSelect={(date) => {
                  if (!date) return;
                  onEndDateChange(toISODateString(date));
                  setToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {error ? (
        <div className={cn(compact ? "mt-2" : "mt-3")}>
          <ErrorBanner error={new Error(error)} />
        </div>
      ) : null}
    </div>
  );
}
