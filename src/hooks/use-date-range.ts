import { useState, useMemo } from "react";
import { differenceInMonths, parseISO } from "date-fns";

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
  defaultStartDate = "2025-01-01",
  defaultEndDate = "2025-02-15",
  maxMonths = 12,
}: UseDateRangeOptions = {}): UseDateRangeReturn {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const error = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
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
