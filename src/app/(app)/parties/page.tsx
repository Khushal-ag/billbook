"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { PartiesTable } from "@/components/parties/PartySections";
import { Switch } from "@/components/ui/switch";
import { useParties } from "@/hooks/use-parties";
import { useDebounce } from "@/hooks/use-debounce";
import type { Party } from "@/types/party";

const PARTY_TYPE = "CUSTOMER" as const;

export default function Parties() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | undefined>();
  const [includeInactive, setIncludeInactive] = useState(true);

  const { data, isPending, error } = useParties({
    type: PARTY_TYPE,
    includeInactive,
    search: debouncedSearch || undefined,
  });

  const parties = data?.parties ?? [];

  const openCreate = () => {
    setEditParty(undefined);
    setDialogOpen(true);
  };
  const openEdit = (p: Party) => {
    setEditParty(p);
    setDialogOpen(true);
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Customer"
        description="Manage customers for invoicing"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search customers..."
        className="mb-4 w-full sm:max-w-sm"
      />

      <div className="mb-4 flex w-fit items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-1.5">
        <Switch
          checked={includeInactive}
          onCheckedChange={setIncludeInactive}
          aria-label="Show inactive customers"
        />
        <span className="text-sm text-muted-foreground">Show inactive</span>
      </div>

      <ErrorBanner error={error} fallbackMessage="Failed to load customers" />

      {isPending ? (
        <TableSkeleton rows={3} />
      ) : parties.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No customers found"
          description={
            debouncedSearch
              ? `No customers match "${debouncedSearch}". Try a different search or add a new customer.`
              : "Add your first customer to get started."
          }
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          }
        />
      ) : (
        <PartiesTable
          parties={parties}
          onEdit={openEdit}
          onLedger={(partyId) => router.push(`/parties/${partyId}/ledger?from=parties`)}
        />
      )}

      <PartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        party={editParty}
        defaultType="CUSTOMER"
        typeLocked
      />
    </div>
  );
}
