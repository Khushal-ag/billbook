import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import PartyDialog from "@/components/dialogs/PartyDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { PartiesTable } from "@/components/parties/PartySections";
import { useParties, useDeleteParty } from "@/hooks/use-parties";
import { usePermissions } from "@/hooks/use-permissions";
import { useDebounce } from "@/hooks/use-debounce";
import type { Party } from "@/types/party";
import { showSuccessToast, showErrorToast } from "@/lib/toast-helpers";

const PARTY_TYPE = "SUPPLIER" as const;

export default function Vendors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; party: Party | null }>({
    open: false,
    party: null,
  });
  const { isOwner } = usePermissions();

  const { data, isPending, error } = useParties({ type: PARTY_TYPE });
  const deleteParty = useDeleteParty();

  const parties = data?.parties ?? [];
  const filtered = parties.filter(
    (p) =>
      !p.deletedAt &&
      p.type === PARTY_TYPE &&
      (!debouncedSearch || p.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
  );

  const openCreate = () => {
    setEditParty(undefined);
    setDialogOpen(true);
  };
  const openEdit = (p: Party) => {
    setEditParty(p);
    setDialogOpen(true);
  };

  const handleDelete = (p: Party) => {
    setDeleteConfirm({ open: true, party: p });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.party) return;
    deleteParty.mutate(deleteConfirm.party.id, {
      onSuccess: () => {
        showSuccessToast("Vendor deleted");
        setDeleteConfirm({ open: false, party: null });
      },
      onError: (err) => {
        showErrorToast(err, "Failed to delete");
        setDeleteConfirm({ open: false, party: null });
      },
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Vendor"
        description="Manage vendors and suppliers for stock"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search vendors..."
        className="mb-4 w-full sm:max-w-sm"
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load vendors" />

      {isPending ? (
        <TableSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-5 w-5" />}
          title="No vendors found"
          description="Add your first vendor to get started."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          }
        />
      ) : (
        <PartiesTable
          parties={filtered}
          isOwner={isOwner}
          deletePending={deleteParty.isPending}
          onEdit={openEdit}
          onLedger={(partyId) => navigate(`/parties/${partyId}/ledger`)}
          onDelete={handleDelete}
        />
      )}

      <PartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        party={editParty}
        defaultType="SUPPLIER"
        typeLocked
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, party: deleteConfirm.party })}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${deleteConfirm.party?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
