"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProfileGateFlags } from "@/lib/business/business-document-gate";
import type { BusinessProfile } from "@/types/auth";

const COPY = {
  invoices: {
    title: "Invoices are not available yet",
    profile: "Finish your business profile so you can create invoices.",
  },
  "credit-notes": {
    title: "Credit notes are not available yet",
    profile: "Finish your business profile so you can create credit notes.",
  },
} as const;

export type BusinessProfileGateContext = keyof typeof COPY;

interface BusinessProfileGateAlertProps {
  businessProfile: BusinessProfile | null | undefined;
  className?: string;
  context?: BusinessProfileGateContext;
}

export function BusinessProfileGateAlert({
  businessProfile,
  className,
  context = "invoices",
}: BusinessProfileGateAlertProps) {
  const { profileBlocked, validityBlocked } = getProfileGateFlags(businessProfile);

  if (!profileBlocked && !validityBlocked) return null;

  const text = COPY[context];

  return (
    <Alert
      className={
        className ??
        "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100"
      }
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-sm">{text.title}</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        {profileBlocked ? <p>{text.profile}</p> : null}
        {validityBlocked ? <p>Your access period has ended. Renew to continue.</p> : null}
        <p>
          <Link
            href="/profile"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Go to business profile
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  );
}
