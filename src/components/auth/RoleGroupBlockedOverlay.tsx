"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGroupBlockedOverlayProps {
  message: string;
  onTryAgain: () => void | Promise<void>;
  trying: boolean;
  onDismiss: () => void;
}

export function RoleGroupBlockedOverlay({
  message,
  onTryAgain,
  trying,
  onDismiss,
}: RoleGroupBlockedOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="role-group-blocked-title"
      aria-describedby="role-group-blocked-desc"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <h2 id="role-group-blocked-title" className="text-lg font-semibold tracking-tight">
          Access paused
        </h2>
        <p
          id="role-group-blocked-desc"
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          {message}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Please contact the business owner. They can assign you to an active role or fix your
          permissions.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void onTryAgain()} disabled={trying}>
            {trying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Try again
          </Button>
          <Button type="button" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
