import { Package, IndianRupee, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

const KPI_ITEMS = [
  {
    label: "Total Items",
    value: "184",
    sub: "Active",
    Icon: Package,
    color: "text-foreground",
  },
  {
    label: "Stock Value",
    value: "₹12.4L",
    sub: "Purchase cost",
    Icon: IndianRupee,
    color: "text-foreground",
  },
  {
    label: "Selling Value",
    value: "₹18.2L",
    sub: "At MRP",
    Icon: TrendingUp,
    color: "text-status-paid",
  },
  {
    label: "Low Stock",
    value: "11 Items",
    sub: "Need reorder",
    Icon: AlertTriangle,
    color: "text-status-pending",
  },
];

const TABLE_ROWS = [
  { name: "A4 Paper Ream", cat: "Stationery", qty: "8", buy: "₹280", sell: "₹350", alert: true },
  {
    name: "Printer Cartridge 12A",
    cat: "Electronics",
    qty: "42",
    buy: "₹1,200",
    sell: "₹1,450",
    alert: false,
  },
  {
    name: "Thermal Roll 80mm",
    cat: "Stationery",
    qty: "5",
    buy: "₹60",
    sell: "₹80",
    alert: true,
  },
  {
    name: "Ballpoint Pen Box",
    cat: "Stationery",
    qty: "120",
    buy: "₹95",
    sell: "₹130",
    alert: false,
  },
  {
    name: "Whiteboard Marker Set",
    cat: "Office",
    qty: "34",
    buy: "₹180",
    sell: "₹240",
    alert: false,
  },
];

const CAPTIONS = [
  "Get instant low-stock alerts before you run out of key items.",
  "Track purchase cost vs. selling price for every item.",
  "Log stock entries when purchase bills arrive — no spreadsheet needed.",
];

export function InventoryTab() {
  return (
    <TabsContent value="inventory" className="mt-8 motion-safe:animate-fade-in">
      <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
        <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Inventory</p>
            <h3 className="text-lg font-semibold text-foreground">Stock Overview</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:block">
              Search items…
            </span>
            <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              + Add Stock Entry
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {KPI_ITEMS.map(({ label, value, sub, Icon, color }) => (
            <div key={label} className="flex items-center gap-4 bg-background px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/60">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Item
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  In Stock
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">
                  Purchase Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Selling Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row) => (
                <tr
                  key={row.name}
                  className="border-b transition-colors last:border-0 hover:bg-muted/20"
                >
                  <td className="px-6 py-3 font-medium">{row.name}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {row.cat}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold tabular-nums ${row.alert ? "text-status-pending" : "text-foreground"}`}
                  >
                    {row.qty}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">
                    {row.buy}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.sell}</td>
                  <td className="px-4 py-3 text-center">
                    {row.alert ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-status-pending-bg px-2.5 py-0.5 text-xs font-medium text-status-pending">
                        <AlertTriangle className="h-3 w-3" /> Low
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-status-paid-bg px-2.5 py-0.5 text-xs font-medium text-status-paid">
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">Showing 5 of 184 items</p>
          <span className="text-xs text-primary">View full inventory →</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {CAPTIONS.map((text) => (
          <p key={text} className="text-sm text-muted-foreground">
            ✦ {text}
          </p>
        ))}
      </div>
    </TabsContent>
  );
}
