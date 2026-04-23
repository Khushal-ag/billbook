import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatISODateDisplay, parseISODateString, toISODateString } from "@/lib/date";
import { cn } from "@/lib/utils";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DateField({ label, value, onChange, minDate, maxDate, required }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const minDateObj = minDate ? parseISODateString(minDate) : undefined;
  const maxDateObj = maxDate ? parseISODateString(maxDate) : undefined;

  const disabled =
    minDateObj || maxDateObj
      ? (date: Date) => {
          const t = startOfLocalDay(date).getTime();
          if (minDateObj && t < startOfLocalDay(minDateObj).getTime()) return true;
          if (maxDateObj && t > startOfLocalDay(maxDateObj).getTime()) return true;
          return false;
        }
      : undefined;

  return (
    <div className="space-y-2">
      <Label required={required}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-8 w-full justify-start gap-2 bg-background px-3 text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{value ? formatISODateDisplay(value, "en-GB", {}) : "dd/mm/yyyy"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={parseISODateString(value)}
            onSelect={(date) => {
              if (!date) return;
              onChange(toISODateString(date));
              setOpen(false);
            }}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
