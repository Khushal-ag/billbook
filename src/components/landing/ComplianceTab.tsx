import { Download, FileSpreadsheet, IndianRupee, Layers, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const KPI_ITEMS = [
  {
    label: "Total tax",
    value: "₹2,95,200",
    sub: "Selected period",
    Icon: IndianRupee,
    color: "text-foreground",
  },
  {
    label: "CGST + SGST",
    value: "₹1,77,120",
    sub: "Intrastate",
    Icon: Receipt,
    color: "text-foreground",
  },
  {
    label: "IGST",
    value: "₹1,18,080",
    sub: "Interstate",
    Icon: Receipt,
    color: "text-foreground",
  },
  {
    label: "Invoices counted",
    value: "247",
    sub: "In range",
    Icon: Layers,
    color: "text-foreground",
  },
];

const MONTHLY_ROWS = [
  {
    month: "Jan 2026",
    taxable: "₹6,42,000",
    tax: "₹1,15,560",
    cgstSgst: "₹92,400",
    igst: "₹23,160",
  },
  {
    month: "Feb 2026",
    taxable: "₹7,18,500",
    tax: "₹1,29,330",
    cgstSgst: "₹1,03,464",
    igst: "₹25,866",
  },
  {
    month: "Mar 2026",
    taxable: "₹8,05,200",
    tax: "₹1,45,236",
    cgstSgst: "₹1,16,189",
    igst: "₹29,047",
  },
];

const ITEMIZED_ROWS = [
  { hsn: "4820", rate: "18%", taxable: "₹4,20,000", cgst: "₹37,800", sgst: "₹37,800", igst: "₹0" },
  { hsn: "8471", rate: "18%", taxable: "₹2,88,500", cgst: "₹0", sgst: "₹0", igst: "₹51,930" },
  { hsn: "9999", rate: "5%", taxable: "₹1,12,000", cgst: "₹2,800", sgst: "₹2,800", igst: "₹0" },
];

const CAPTIONS = [
  "Same Monthly Summary and Itemized tabs as the in-app GST / Tax page — pick any date range.",
  "Download a single HTML pack for the range (labeled “Export for Filing” in the product) for your records.",
  "CGST, SGST, and IGST roll up separately so reconciliation stays straightforward.",
];

export function ComplianceTab() {
  return (
    <TabsContent value="compliance" className="mt-8 motion-safe:animate-fade-in">
      <div className="overflow-hidden rounded-3xl border bg-background shadow-lg ring-1 ring-border/60">
        <div className="flex flex-col gap-4 border-b bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">GST / Tax</p>
            <h3 className="text-lg font-semibold text-foreground">
              Tax summaries and itemized reports
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              1 Jan 2026 – 31 Mar 2026
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Download className="h-3.5 w-3.5" />
              Export for Filing
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

        <div className="px-6 pb-6 pt-5">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/50 p-1 sm:w-auto">
              <TabsTrigger value="summary" className="rounded-lg px-4">
                Monthly Summary
              </TabsTrigger>
              <TabsTrigger value="itemized" className="rounded-lg px-4">
                Itemized
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-0 outline-none">
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Month
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Taxable value
                      </th>
                      <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">
                        CGST + SGST
                      </th>
                      <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground lg:table-cell">
                        IGST
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Total tax
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTHLY_ROWS.map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/15"
                      >
                        <td className="px-4 py-3 font-medium">{row.month}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {row.taxable}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground md:table-cell">
                          {row.cgstSgst}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground lg:table-cell">
                          {row.igst}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                          {row.tax}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="itemized" className="mt-0 outline-none">
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        HSN / SAC
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Taxable
                      </th>
                      <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                        CGST
                      </th>
                      <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                        SGST
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        IGST
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ITEMIZED_ROWS.map((row) => (
                      <tr
                        key={row.hsn}
                        className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/15"
                      >
                        <td className="px-4 py-3 font-medium tabular-nums">{row.hsn}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {row.rate}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.taxable}</td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                          {row.cgst}
                        </td>
                        <td className="hidden px-4 py-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                          {row.sgst}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {row.igst}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid gap-px border-t bg-border sm:grid-cols-3">
          {[
            {
              title: "Period-aware",
              desc: "Totals follow the dates you select — same picker as inside BillBook.",
              Icon: FileSpreadsheet,
            },
            {
              title: "HTML export",
              desc: "One download bundles the report view for the range you chose.",
              Icon: Download,
            },
            {
              title: "Audit-friendly",
              desc: "Works alongside invoice audit history and CSV registers.",
              Icon: Layers,
            },
          ].map(({ title, desc, Icon }) => (
            <div key={title} className="flex gap-3 bg-muted/10 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border/60">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Illustration mirrors the live GST / Tax screen — not government filing software.
          </p>
          <span className="text-xs font-medium text-primary">Open Tax / GST after sign-in →</span>
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
