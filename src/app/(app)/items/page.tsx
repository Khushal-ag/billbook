"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import SearchInput from "@/components/SearchInput";
import PageHeader from "@/components/PageHeader";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ItemDialog from "@/components/items/ItemDialog";
import { ItemsTable } from "@/components/items/ItemsTable";
import { ItemDetailView } from "@/components/items/ItemDetailView";
import { useItems, useCategories } from "@/hooks/use-items";
import { useDebounce } from "@/hooks/use-debounce";
import type { Item } from "@/types/item";
import { Switch } from "@/components/ui/switch";

export default function Items() {
  const router = useRouter();
  const params = useParams<{ itemId?: string | string[] }>();
  const itemId = Array.isArray(params?.itemId) ? params.itemId[0] : params?.itemId;
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [includeInactive, setIncludeInactive] = useState(true);
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | undefined>();

  const {
    data: itemsData,
    isPending: itemsPending,
    error: itemsError,
  } = useItems({
    search: debouncedSearch || undefined,
    categoryId,
    limit: 500,
    includeInactive,
  });
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const filteredItems = itemsData?.items ?? [];

  const openCreate = useCallback(() => {
    setEditItem(undefined);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((item: Item) => {
    setEditItem(item);
    setDialogOpen(true);
  }, []);

  // Detail view when itemId in URL (ledger, current stock)
  if (itemId) {
    return <ItemDetailView id={Number(itemId)} onBack={() => router.push("/items")} />;
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Items"
        description="Products and services for invoices. Set category and tax."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search items..."
          className="w-full sm:max-w-xs"
        />
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-1.5">
          <Switch
            checked={includeInactive}
            onCheckedChange={setIncludeInactive}
            aria-label="Show inactive items"
          />
          <span className="text-sm text-muted-foreground">Show inactive</span>
        </div>
        <Select
          value={categoryId != null ? String(categoryId) : "all"}
          onValueChange={(v) => setCategoryId(v === "all" ? undefined : Number(v))}
        >
          <SelectTrigger className="h-9 w-full min-w-[180px] sm:w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ErrorBanner error={itemsError} fallbackMessage="Failed to load items" />

      {itemsPending ? (
        <TableSkeleton rows={4} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No items found"
          description="Add your first item or service. You can set category while adding—search existing or add a new one on the go."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          }
        />
      ) : (
        <ItemsTable
          items={filteredItems}
          onEdit={openEdit}
          onViewLedger={(id) => router.push(`/items/${id}`)}
        />
      )}

      <ItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editItem} />
    </div>
  );
}
