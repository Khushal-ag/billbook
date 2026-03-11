import {
  ShieldCheck,
  IndianRupee,
  CheckCircle2,
  Download,
  FileText,
  BarChart3,
  Clock,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";

const KPI_ITEMS = [
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
];

const EXPORT_TASKS = [
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
];

const CAPTIONS = [
  "GSTR-1 ready export grouped by tax rate — one click, no reformatting.",
  "GST rate-wise breakdowns: IGST, CGST & SGST tracked separately.",
  "Full audit trail on every invoice so you are always review-ready.",
];

export function ComplianceTab() {
  return (
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

        <div className="divide-y">
          {EXPORT_TASKS.map((row) => (
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
              <span className="shrink-0 text-sm font-medium text-primary">{row.action} →</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3">
          <p className="text-xs text-muted-foreground">All exports include full audit trail</p>
          <span className="text-xs text-primary">Open Compliance Center →</span>
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
