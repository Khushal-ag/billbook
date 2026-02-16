import { useState } from "react";
import { Plus, Users, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/TableSkeleton";
import PartyDialog from "@/components/dialogs/PartyDialog";
import { useParties, useDeleteParty } from "@/hooks/use-parties";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { Party } from "@/types/party";
import { toast } from "sonner";

export default function Parties() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("CUSTOMER");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editParty, setEditParty] = useState<Party | undefined>();
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const { data, isLoading, error } = useParties({ type: tab });
  const deleteParty = useDeleteParty();

  const parties = data?.parties ?? [];
  const filtered = parties.filter(
    (p) =>
      !p.deletedAt &&
      p.type === tab &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
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
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    deleteParty.mutate(p.id, {
      onSuccess: () => toast.success("Party deleted"),
      onError: (err) => toast.error("Failed to delete", { description: err.message }),
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
        <TabsList>
          <TabsTrigger value="CUSTOMER">Customers</TabsTrigger>
          <TabsTrigger value="SUPPLIER">Suppliers</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search parties..."
        className="mb-4 max-w-sm"
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load parties" />

      {isLoading ? (
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
        <div className="data-table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Phone</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">GSTIN</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">State</th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                  Opening Balance
                </th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/20"
                >
                  <td className="px-6 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.phone || "—"}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {p.gstin || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{p.state || "—"}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatCurrency(p.openingBalance ?? "0")}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p)}
                          disabled={deleteParty.isPending}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        party={editParty}
        defaultType={tab as "CUSTOMER" | "SUPPLIER"}
      />
    </div>
  );
}
