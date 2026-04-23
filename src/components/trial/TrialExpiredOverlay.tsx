"use client";

import { Lock } from "lucide-react";
import { isValidityPeriodEnded } from "@/lib/business/trial";

type TrialExpiredOverlayProps = {
  validityEnd: string | null | undefined;
};

/**
 * Blocks the main app when the business validity end is in the past (client clock).
 * Mutations may still return TRIAL_EXPIRED — handle those with toasts as well.
 */
export function TrialExpiredOverlay({ validityEnd }: TrialExpiredOverlayProps) {
  if (!isValidityPeriodEnded(validityEnd)) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-expired-title"
      aria-describedby="trial-expired-desc"
    >
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <h2 id="trial-expired-title" className="text-lg font-semibold tracking-tight">
          Trial period ended
        </h2>
        <p id="trial-expired-desc" className="mt-2 text-sm text-muted-foreground">
          Creating invoices, receipts, payments, and credit notes is disabled until your
          organization’s access is extended. Please contact your administrator or BillBook support.
        </p>
        {validityEnd ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Validity ended:{" "}
            {new Date(validityEnd).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
