import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Parties() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [tab, setTab] = useState("CUSTOMER");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; party: Party | null }>({
    open: false,
    party: null,
  });
  const { isOwner } = usePermissions();

  const { data, isPending, error } = useParties({ type: tab });
  const deleteParty = useDeleteParty();

  const parties = data?.parties ?? [];
  const filtered = parties.filter(
    (p) =>
      !p.deletedAt &&
      p.type === tab &&
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
        showSuccessToast("Party deleted");
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
        title="Parties"
        description="Customers and suppliers"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Party
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap sm:w-auto">
          <TabsTrigger value="CUSTOMER">Customers</TabsTrigger>
          <TabsTrigger value="SUPPLIER">Suppliers</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search parties..."
        className="mb-4 w-full sm:max-w-sm"
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load parties" />

      {isPending ? (
        <TableSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No parties found"
          description={`Add your first ${tab.toLowerCase()} to get started.`}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add {tab === "CUSTOMER" ? "Customer" : "Supplier"}
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
        defaultType={tab as "CUSTOMER" | "SUPPLIER"}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, party: deleteConfirm.party })}
        onConfirm={confirmDelete}
        title="Delete Party"
        description={`Are you sure you want to delete "${deleteConfirm.party?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
