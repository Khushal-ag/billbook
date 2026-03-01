import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function Items() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
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
  });
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const items = itemsData?.items ?? [];
  const filteredItems = items.filter((i) => !i.deletedAt);

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
    return <ItemDetailView id={Number(itemId)} onBack={() => navigate("/items")} />;
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
          onViewLedger={(id) => navigate(`/items/${id}`)}
        />
      )}

      <ItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editItem} />
    </div>
  );
}
