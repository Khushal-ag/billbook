import { Pencil, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Item } from "@/types/item";
import { getItemCategoryDisplay, getItemTaxDisplay } from "@/types/item";

interface ItemsTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onViewLedger: (id: number) => void;
}

export function ItemsTable({ items, onEdit, onViewLedger }: ItemsTableProps) {
  return (
    <div className="data-table-container">
      <table className="w-full text-sm" role="table" aria-label="Items list">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="min-w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </th>
            <th className="min-w-[70px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </th>
            <th className="hidden min-w-[90px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
              Category
            </th>
            <th className="min-w-[52px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Unit
            </th>
            <th className="hidden min-w-[100px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
              Tax
            </th>
            <th className="hidden min-w-[80px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
              HSN / SAC
            </th>
            <th className="min-w-[132px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr
              key={item.id}
              className="group cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => onViewLedger(item.id)}
            >
              <td className="px-4 py-3.5">
                <span className="truncate font-medium text-foreground" title={item.name}>
                  {item.name}
                </span>
                {item.description && (
                  <p
                    className="mt-0.5 truncate text-xs text-muted-foreground"
                    title={item.description}
                  >
                    {item.description}
                  </p>
                )}
              </td>
              <td className="px-3 py-3.5 align-middle">
                <Badge variant="secondary" className="text-xs font-medium">
                  {item.type}
                </Badge>
              </td>
              <td className="hidden px-3 py-3.5 align-middle text-muted-foreground md:table-cell">
                <span className="truncate" title={getItemCategoryDisplay(item)}>
                  {getItemCategoryDisplay(item)}
                </span>
              </td>
              <td className="px-3 py-3.5 align-middle text-muted-foreground">{item.unit || "—"}</td>
              <td className="hidden px-3 py-3.5 align-middle text-muted-foreground md:table-cell">
                <span className="text-xs">{getItemTaxDisplay(item)}</span>
              </td>
              <td className="hidden px-3 py-3.5 align-middle font-mono text-xs text-muted-foreground lg:table-cell">
                {item.hsnCode || item.sacCode || "—"}
              </td>
              <td className="px-3 py-3.5 text-right align-middle">
                <div
                  className="flex items-center justify-end gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(item)}
                    title="Edit"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onViewLedger(item.id)}
                    title="View ledger"
                    aria-label={`View ledger for ${item.name}`}
                  >
                    <History className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
