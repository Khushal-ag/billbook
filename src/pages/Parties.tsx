import { useState } from "react";
import { Plus, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/TableSkeleton";
import { useParties, useDeleteParty } from "@/hooks/use-parties";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";

export default function Parties() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("CUSTOMER");
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const { data, isLoading, error } = useParties({ type: tab });
  const deleteParty = useDeleteParty();

  const parties = data?.data || [];
  const filtered = parties.filter(
    (p) =>
      !p.deletedAt &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Parties"
        description="Customers and suppliers"
        action={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
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
        className="max-w-sm mb-4"
      />

      <ErrorBanner error={error} fallbackMessage="Failed to load parties" />

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No parties found"
          description={`Add your first ${tab.toLowerCase()} to get started.`}
        />
      ) : (
        <div className="data-table-container">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-6 py-3">
                  Name
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3">
                  Phone
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3">
                  GSTIN
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-3">
                  State
                </th>
                <th className="text-right font-medium text-muted-foreground px-3 py-3">
                  Outstanding
                </th>
                {isOwner && (
                  <th className="text-center font-medium text-muted-foreground px-3 py-3">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {p.phone || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground font-mono text-xs">
                    {p.gstin || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {p.state || "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatCurrency(p.outstandingBalance)}
                  </td>
                  {isOwner && (
                    <td className="px-3 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(`Delete ${p.name}? This cannot be undone.`)
                          ) {
                            deleteParty.mutate(p.id);
                          }
                        }}
                        disabled={deleteParty.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
