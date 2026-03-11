import { FileText, Package, BarChart3, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicingTab } from "@/components/landing/InvoicingTab";
import { InventoryTab } from "@/components/landing/InventoryTab";
import { ReportsTab } from "@/components/landing/ReportsTab";
import { ComplianceTab } from "@/components/landing/ComplianceTab";

const TAB_ITEMS = [
  { value: "invoicing", label: "Invoicing", Icon: FileText },
  { value: "inventory", label: "Inventory", Icon: Package },
  { value: "reports", label: "Reports", Icon: BarChart3 },
  { value: "compliance", label: "Compliance", Icon: ShieldCheck },
];

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
            <div className="flex justify-center">
              <TabsList className="h-auto gap-0 rounded-2xl bg-background p-1.5 shadow-sm ring-1 ring-border">
                {TAB_ITEMS.map(({ value, label, Icon }) => (
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

            <InvoicingTab />
            <InventoryTab />
            <ReportsTab />
            <ComplianceTab />
          </Tabs>
        </div>
      </div>
    </section>
  );
}
