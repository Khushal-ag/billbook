import {
  FileText,
  Package,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  IndianRupee,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LandingFeatureTabs() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Everything in one place
          </p>
          <h2 className="text-balance text-4xl font-semibold tracking-tight text-foreground">
            Your entire business, one platform
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From first invoice to compliance report — see exactly what you get before you sign up.
          </p>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="invoicing" className="w-full">
            {/* Tab bar */}
            <div className="flex justify-center">
              <TabsList className="h-auto gap-0 rounded-2xl bg-background p-1.5 shadow-sm ring-1 ring-border">
                {[
                  { value: "invoicing", label: "Invoicing", Icon: FileText },
                  { value: "inventory", label: "Inventory", Icon: Package },
                  { value: "reports", label: "Reports", Icon: BarChart3 },
                  { value: "compliance", label: "Compliance", Icon: ShieldCheck },
                ].map(({ value, label, Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── INVOICING ── */}
            <TabsContent value="invoicing" className="mt-8 motion-safe:animate-fade-in">
              <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
                {/* Mock app chrome */}
                <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Invoices
                    </p>
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

                {/* KPI strip */}
                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  {[
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
                  ].map(({ label, value, sub, Icon, color }) => (
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

                {/* Table */}
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
                      {[
                        {
                          id: "INV-2041",
                          party: "Suriya Traders",
                          date: "7 Mar 2026",
                          amount: "₹42,860",
                          due: "₹42,860",
                          status: "PENDING",
                          statusColor:
                            "bg-status-pending-bg text-status-pending border-transparent",
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
                          statusColor:
                            "bg-status-overdue-bg text-status-overdue border-transparent",
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
                          statusColor:
                            "bg-status-pending-bg text-status-pending border-transparent",
                        },
                      ].map((row) => (
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
                          <td className="px-4 py-3 text-right font-medium tabular-nums">
                            {row.amount}
                          </td>
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

                {/* Bottom bar */}
                <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
                  <p className="text-xs text-muted-foreground">Showing 5 of 247 invoices</p>
                  <span className="text-xs text-primary">View all invoices →</span>
                </div>
              </div>

              {/* Caption */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  "Create, edit, and send invoices in seconds with auto-calculated tax.",
                  "Track payment status and overdue amounts across all parties.",
                  "Record partial payments and see the exact balance due per invoice.",
                ].map((text) => (
                  <p key={text} className="text-sm text-muted-foreground">
                    ✦ {text}
                  </p>
                ))}
              </div>
            </TabsContent>

            {/* ── INVENTORY ── */}
            <TabsContent value="inventory" className="mt-8 motion-safe:animate-fade-in">
              <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
                <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Inventory
                    </p>
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

                {/* KPI strip */}
                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  {[
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
                  ].map(({ label, value, sub, Icon, color }) => (
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
                      {[
                        {
                          name: "A4 Paper Ream",
                          cat: "Stationery",
                          qty: "8",
                          buy: "₹280",
                          sell: "₹350",
                          alert: true,
                        },
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
                      ].map((row) => (
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
                {[
                  "Get instant low-stock alerts before you run out of key items.",
                  "Track purchase cost vs. selling price for every item.",
                  "Log stock entries when purchase bills arrive — no spreadsheet needed.",
                ].map((text) => (
                  <p key={text} className="text-sm text-muted-foreground">
                    ✦ {text}
                  </p>
                ))}
              </div>
            </TabsContent>

            {/* ── REPORTS ── */}
            <TabsContent value="reports" className="mt-8 motion-safe:animate-fade-in">
              <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
                <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Reports
                    </p>
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

                {/* KPI strip */}
                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  {[
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
                  ].map(({ label, value, sub, Icon, color }) => (
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

                {/* Bar chart */}
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

                {/* Outstanding party table */}
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
                      {[
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
                      ].map((row) => (
                        <tr
                          key={row.party}
                          className="border-b transition-colors last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-6 py-3 font-medium">{row.party}</td>
                          <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                            {row.invoiced}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-status-paid">
                            {row.paid}
                          </td>
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
                {[
                  "Sales trend charts broken down by month — no setup needed.",
                  "Party outstanding report shows who owes what at a glance.",
                  "Item-wise sales report for your accountant and tax filing.",
                ].map((text) => (
                  <p key={text} className="text-sm text-muted-foreground">
                    ✦ {text}
                  </p>
                ))}
              </div>
            </TabsContent>

            {/* ── COMPLIANCE ── */}
            <TabsContent value="compliance" className="mt-8 motion-safe:animate-fade-in">
              <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
                <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Compliance
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">Tax & Filing Center</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 3 Ready to Export
                  </span>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                  {[
                    {
                      label: "Tax Collected",
                      value: "₹2,95,200",
                      sub: "This quarter",
                      Icon: IndianRupee,
                      color: "text-foreground",
                    },
                    {
                      label: "IGST",
                      value: "₹1,18,080",
                      sub: "Interstate",
                      Icon: ShieldCheck,
                      color: "text-foreground",
                    },
                    {
                      label: "CGST + SGST",
                      value: "₹1,77,120",
                      sub: "Intrastate",
                      Icon: ShieldCheck,
                      color: "text-foreground",
                    },
                    {
                      label: "Invoices Filed",
                      value: "213 / 247",
                      sub: "34 pending review",
                      Icon: CheckCircle2,
                      color: "text-status-paid",
                    },
                  ].map(({ label, value, sub, Icon, color }) => (
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

                {/* Export tasks */}
                <div className="divide-y">
                  {[
                    {
                      title: "GSTR-1 Summary",
                      desc: "Invoice-level export grouped by tax rate — ready for filing",
                      status: "Ready",
                      statusColor: "bg-status-paid-bg text-status-paid",
                      action: "Download",
                      Icon: Download,
                    },
                    {
                      title: "E-Invoice Register",
                      desc: "IRN-tagged invoice list for auditor submission",
                      status: "Ready",
                      statusColor: "bg-status-paid-bg text-status-paid",
                      action: "Preview",
                      Icon: FileText,
                    },
                    {
                      title: "Tax Ledger Report",
                      desc: "Rate-wise tax breakdowns: IGST, CGST, SGST",
                      status: "Ready",
                      statusColor: "bg-status-paid-bg text-status-paid",
                      action: "Export",
                      Icon: BarChart3,
                    },
                    {
                      title: "Outstanding Invoices",
                      desc: "Unpaid invoices for follow-up — grouped by party",
                      status: "Pending",
                      statusColor: "bg-status-pending-bg text-status-pending",
                      action: "View",
                      Icon: Clock,
                    },
                  ].map((row) => (
                    <div
                      key={row.title}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/60">
                        <row.Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{row.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.desc}</p>
                      </div>
                      <span
                        className={`hidden shrink-0 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium sm:inline-flex ${row.statusColor}`}
                      >
                        {row.status}
                      </span>
                      <span className="shrink-0 text-sm font-medium text-primary">
                        {row.action} →
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
                  <p className="text-xs text-muted-foreground">
                    All exports include full audit trail
                  </p>
                  <span className="text-xs text-primary">Open Compliance Center →</span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  "GSTR-1 ready export grouped by tax rate — one click, no reformatting.",
                  "GST rate-wise breakdowns: IGST, CGST & SGST tracked separately.",
                  "Full audit trail on every invoice so you are always review-ready.",
                ].map((text) => (
                  <p key={text} className="text-sm text-muted-foreground">
                    ✦ {text}
                  </p>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
