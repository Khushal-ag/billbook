import { TrendingUp, IndianRupee, TrendingDown, ShieldCheck } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

const KPI_ITEMS = [
  {
    label: "Gross Sales",
    value: "₹24,60,000",
    sub: "Q1 2026",
    Icon: TrendingUp,
    color: "text-foreground",
  },
  {
    label: "Collected",
    value: "₹21,25,500",
    sub: "86% of gross",
    Icon: IndianRupee,
    color: "text-status-paid",
  },
  {
    label: "Outstanding",
    value: "₹3,34,500",
    sub: "Across 28 parties",
    Icon: TrendingDown,
    color: "text-status-overdue",
  },
  {
    label: "Tax Collected",
    value: "₹2,95,200",
    sub: "GST payable",
    Icon: ShieldCheck,
    color: "text-foreground",
  },
];

const OUTSTANDING_ROWS = [
  {
    party: "Metro Mart",
    invoiced: "₹1,24,000",
    paid: "₹92,800",
    due: "₹31,200",
  },
  {
    party: "Suriya Traders",
    invoiced: "₹85,720",
    paid: "₹43,000",
    due: "₹42,720",
  },
  {
    party: "Arjun & Co.",
    invoiced: "₹56,400",
    paid: "₹36,400",
    due: "₹20,000",
  },
];

const CAPTIONS = [
  "Sales trend charts broken down by month — no setup needed.",
  "Party outstanding report shows who owes what at a glance.",
  "Item-wise sales report for your accountant and tax filing.",
];

export function ReportsTab() {
  return (
    <TabsContent value="reports" className="mt-8 motion-safe:animate-fade-in">
      <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
        <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Reports</p>
            <h3 className="text-lg font-semibold text-foreground">Business Analytics</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:block">
              Jan 2026 – Mar 2026
            </span>
            <span className="rounded-full border bg-background px-4 py-1.5 text-xs font-medium">
              Export
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

        <div className="border-b px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Monthly Sales Trend</p>
            <p className="text-xs text-muted-foreground">Jan – Mar 2026</p>
          </div>
          <div className="flex h-36 items-end gap-3">
            {[
              { month: "Jan", gross: 72, paid: 58 },
              { month: "Feb", gross: 88, paid: 75 },
              { month: "Mar", gross: 100, paid: 86 },
            ].map(({ month, gross, paid }) => (
              <div key={month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center gap-1">
                  <div
                    className="w-6 rounded-t-sm bg-primary/30 transition-all"
                    style={{ height: `${gross}px` }}
                  />
                  <div
                    className="w-6 rounded-t-sm bg-primary transition-all"
                    style={{ height: `${paid}px` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{month}</p>
              </div>
            ))}
            <div className="ml-auto flex flex-col justify-end gap-2 pb-5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
                <span className="text-[11px] text-muted-foreground">Gross</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                <span className="text-[11px] text-muted-foreground">Collected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Party
                </th>
                <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                  Total Invoiced
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Outstanding
                </th>
              </tr>
            </thead>
            <tbody>
              {OUTSTANDING_ROWS.map((row) => (
                <tr
                  key={row.party}
                  className="border-b transition-colors last:border-0 hover:bg-muted/20"
                >
                  <td className="px-6 py-3 font-medium">{row.party}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {row.invoiced}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-status-paid">{row.paid}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-status-overdue">
                    {row.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">Party outstanding — top 3 shown</p>
          <span className="text-xs text-primary">View full report →</span>
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
