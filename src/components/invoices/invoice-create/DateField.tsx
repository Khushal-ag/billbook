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
}

export function DateField({ label, value, onChange, minDate }: DateFieldProps) {
  const minDateObj = minDate ? parseISODateString(minDate) : undefined;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 w-full justify-start gap-2 bg-background px-3 text-left font-normal",
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
            }}
            disabled={
              minDateObj
                ? (date) =>
                    date <
                    new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate())
                : undefined
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
