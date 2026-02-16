import { useState, useMemo } from "react";
import { differenceInMonths } from "date-fns";

interface UseDateRangeOptions {
  defaultStartDate?: string;
  defaultEndDate?: string;
  maxMonths?: number;
}

interface UseDateRangeReturn {
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  error: string | null;
  isValid: boolean;
  /** startDate if valid, else empty string (safe to pass to query hooks) */
  validStartDate: string;
  /** endDate if valid, else empty string (safe to pass to query hooks) */
  validEndDate: string;
}

export function useDateRange({
  defaultStartDate = toISODateStringLocal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  ),
  defaultEndDate = toISODateStringLocal(new Date()),
  maxMonths = 12,
}: UseDateRangeOptions = {}): UseDateRangeReturn {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const error = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = parseISODateStringLocal(startDate);
    const end = parseISODateStringLocal(endDate);
    if (!start || !end) return "Invalid date range.";
    if (start > end) return "Start date must be before end date.";
    if (differenceInMonths(end, start) > maxMonths)
      return `Maximum date range is ${maxMonths} months.`;
    return null;
  }, [startDate, endDate, maxMonths]);

  const isValid = !error && !!startDate && !!endDate;

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    error,
    isValid,
    validStartDate: isValid ? startDate : "",
    validEndDate: isValid ? endDate : "",
  };
}

function parseISODateStringLocal(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toISODateStringLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
