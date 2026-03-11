import { FileText, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

const KPI_ITEMS = [
  {
    label: "Gross Invoiced",
    value: "₹8,42,000",
    sub: "This month",
    Icon: IndianRupee,
    color: "text-foreground",
  },
  {
    label: "Total Paid",
    value: "₹6,08,500",
    sub: "Collected",
    Icon: TrendingUp,
    color: "text-status-paid",
  },
  {
    label: "Outstanding",
    value: "₹1,34,500",
    sub: "Due",
    Icon: TrendingDown,
    color: "text-status-overdue",
  },
  {
    label: "Invoices",
    value: "247",
    sub: "36 open",
    Icon: FileText,
    color: "text-foreground",
  },
];

const TABLE_ROWS = [
  {
    id: "INV-2041",
    party: "Suriya Traders",
    date: "7 Mar 2026",
    amount: "₹42,860",
    due: "₹42,860",
    status: "PENDING",
    statusColor: "bg-status-pending-bg text-status-pending border-transparent",
  },
  {
    id: "INV-2040",
    party: "Noor Retail",
    date: "5 Mar 2026",
    amount: "₹18,500",
    due: "₹0",
    status: "PAID",
    statusColor: "bg-status-paid-bg text-status-paid border-transparent",
  },
  {
    id: "INV-2039",
    party: "Metro Mart",
    date: "1 Mar 2026",
    amount: "₹31,200",
    due: "₹31,200",
    status: "OVERDUE",
    statusColor: "bg-status-overdue-bg text-status-overdue border-transparent",
  },
  {
    id: "INV-2038",
    party: "Quick Supplies",
    date: "27 Feb 2026",
    amount: "₹9,750",
    due: "₹0",
    status: "PAID",
    statusColor: "bg-status-paid-bg text-status-paid border-transparent",
  },
  {
    id: "INV-2037",
    party: "Arjun & Co.",
    date: "24 Feb 2026",
    amount: "₹56,400",
    due: "₹20,000",
    status: "PENDING",
    statusColor: "bg-status-pending-bg text-status-pending border-transparent",
  },
];

const CAPTIONS = [
  "Create, edit, and send invoices in seconds with auto-calculated tax.",
  "Track payment status and overdue amounts across all parties.",
  "Record partial payments and see the exact balance due per invoice.",
];

export function InvoicingTab() {
  return (
    <TabsContent value="invoicing" className="mt-8 motion-safe:animate-fade-in">
      <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
        <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Invoices</p>
            <h3 className="text-lg font-semibold text-foreground">All Invoices</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:block">
              Search invoices…
            </span>
            <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
              + New Invoice
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
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Party
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">
                  Balance Due
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors last:border-0 hover:bg-muted/20"
                >
                  <td className="px-6 py-3 font-medium text-primary">{row.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {row.party[0]}
                      </span>
                      <span className="font-medium">{row.party}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {row.date}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{row.amount}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">
                    {row.due}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${row.statusColor}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">Showing 5 of 247 invoices</p>
          <span className="text-xs text-primary">View all invoices →</span>
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
