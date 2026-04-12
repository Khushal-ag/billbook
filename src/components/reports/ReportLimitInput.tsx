"use client";

import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { clampReportLimit, MAX_REPORT_LIMIT } from "@/constants";

type ReportLimitInputProps = {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  /** Label above field (e.g. admin toolbars); default is horizontal on `sm+`. */
  stacked?: boolean;
};

export function ReportLimitInput({
  id = "report-limit",
  value,
  onChange,
  stacked = false,
}: ReportLimitInputProps) {
  const [text, setText] = useState(() => String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === "") {
      setText(String(value));
      return;
    }
    const n = parseInt(trimmed, 10);
    if (Number.isNaN(n)) {
      setText(String(value));
      return;
    }
    const clamped = clampReportLimit(n);
    onChange(clamped);
    setText(String(clamped));
  };

  const input = (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      className={
        stacked ? "h-9 w-full min-w-[5.5rem] max-w-[7rem] font-mono tabular-nums" : "w-full sm:w-28"
      }
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^\d+$/.test(v)) setText(v);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );

  const hint = (
    <span className="text-xs text-muted-foreground">Max {MAX_REPORT_LIMIT.toLocaleString()}</span>
  );

  if (stacked) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          Row limit
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          {input}
          {hint}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <Label htmlFor={id} className="whitespace-nowrap text-muted-foreground">
        Row limit
      </Label>
      {input}
      {hint}
    </div>
  );
}
