"use client";

import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shouldShowTrialBanner } from "@/lib/trial";

type TrialBannerProps = {
  validityEnd: string | null | undefined;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export function TrialBanner({ validityEnd, onRefresh, refreshing }: TrialBannerProps) {
  if (!validityEnd || !shouldShowTrialBanner(validityEnd, 5)) return null;

  const label = new Date(validityEnd).toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
    >
      <div className="flex min-w-0 items-center gap-2">
        <CalendarClock
          className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
          aria-hidden
        />
        <span className="min-w-0">
          Trial access ends on <strong className="font-semibold">{label}</strong>. Save your work
          and ask your admin to extend validity if needed.
        </span>
      </div>
      {onRefresh && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-amber-600/40 bg-background/80"
          onClick={() => onRefresh()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh status"}
        </Button>
      )}
    </div>
  );
}
