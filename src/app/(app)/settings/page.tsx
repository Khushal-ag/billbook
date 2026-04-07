"use client";

import { Building2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BusinessUsersCard, DocumentNumberingCard } from "@/components/settings/SettingsSections";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Business settings"
        description="Configure document numbering, defaults, and team access for your organization."
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <section aria-labelledby="org-settings-heading">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"
              aria-hidden
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="org-settings-heading"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                Organization
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  Business settings
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Applies to everyone in this business. Only <strong>owners</strong> can update
                document numbering and default settings.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-6 sm:p-8">
              <DocumentNumberingCard embedded />
            </div>
            <Separator />
            <div className="p-6 sm:p-8">
              <BusinessUsersCard embedded />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
