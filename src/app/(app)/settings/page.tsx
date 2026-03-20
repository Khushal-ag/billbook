"use client";

import { Building2, Settings2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { BusinessUsersCard, DocumentNumberingCard } from "@/components/settings/SettingsSections";
import { InterfaceModeCard } from "@/components/settings/InterfaceModeCard";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Business settings"
        description="Configure document numbering, defaults, and team access for your organization. Personal display options are separate below."
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        {/* Business settings — primary panel */}
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
                Applies to everyone in this business. Document rules use{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">
                  /business/settings
                </code>
                ; only <strong>owners</strong> can edit numbering and defaults.
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

        {/* Personal */}
        <section aria-labelledby="personal-settings-heading">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <Settings2 className="h-4 w-4" aria-hidden />
            <h2
              id="personal-settings-heading"
              className="text-xs font-semibold uppercase tracking-wider"
            >
              Personal
            </h2>
          </div>
          <InterfaceModeCard />
        </section>
      </div>
    </div>
  );
}
