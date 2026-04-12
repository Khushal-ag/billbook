"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { BusinessUsersCard } from "@/components/settings/SettingsSections";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export default function TeamPage() {
  const { isOwner } = usePermissions();

  if (!isOwner) {
    return (
      <div className="page-container animate-fade-in">
        <PageHeader
          title="Team"
          description="Only the business owner can manage who can sign in to this organization."
        />
        <div className="mx-auto max-w-lg rounded-lg border border-border bg-muted/20 px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            If you need access for a colleague, ask your owner to add them from{" "}
            <strong>Team</strong> in the sidebar.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Team"
        description="Invite staff with the same organization code they use at login. Deactivate access when someone should no longer use this business."
      />

      <div className="mx-auto w-full max-w-3xl">
        <BusinessUsersCard />
      </div>
    </div>
  );
}
