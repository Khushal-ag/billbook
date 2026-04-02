"use client";

import { Sparkles } from "lucide-react";

/**
 * Subscription billing is not implemented yet. This page is static — no `/subscriptions/*` API calls.
 * When the feature ships, wire `useSubscription` / `usePlans` here and remove this placeholder.
 */
export default function Subscription() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Subscription</h1>
        <p className="page-description">Manage your plan and usage</p>
      </div>

      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">Coming soon</h2>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          Subscription management isn&apos;t available yet. We&apos;ll notify you when you can
          choose a plan here.
        </p>
        <span className="mt-6 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          We&apos;re working on it
        </span>
      </div>
    </div>
  );
}
