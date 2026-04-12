"use client";

import { Building2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { DocumentNumberingCard } from "@/components/settings/SettingsSections";
import { usePermissions } from "@/hooks/use-permissions";

export default function SettingsPage() {
  const { isOwner } = usePermissions();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Business settings"
        description="Configure document numbering and defaults for your organization. Owners manage team access from Team in the sidebar."
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
                Applies to everyone in this business. Only <strong>owners</strong> can change
                document numbering and defaults.{" "}
                {!isOwner && "You can review prefixes and sequences below."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="p-6 sm:p-8">
              <DocumentNumberingCard embedded />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
