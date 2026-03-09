import { BarChart3, Globe, LifeBuoy, MessageCircle, ShieldCheck, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingValueGrid() {
  return (
    <section className="bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            More than billing — operational clarity
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Practical features that make day-to-day work smoother for owners and teams.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
          {[
            { value: "₹0", label: "Free to start" },
            { value: "< 2 min", label: "First invoice" },
            { value: "5+", label: "Export formats" },
            { value: "100%", label: "Audit-tracked" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center bg-card px-4 py-6 text-center"
            >
              <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Multi-language ready",
              icon: Globe,
              desc: "Keep usage accessible across teams.",
            },
            {
              title: "Responsive support",
              icon: LifeBuoy,
              desc: "Help when you need it — without long hand-offs.",
            },
            {
              title: "WhatsApp / email sharing",
              icon: MessageCircle,
              desc: "Share invoices and updates in common channels.",
            },
            {
              title: "Secure by default",
              icon: ShieldCheck,
              desc: "Clear access boundaries and safer workflows.",
            },
            {
              title: "Transparent records",
              icon: BarChart3,
              desc: "Reports that are easy to reconcile and review.",
            },
            {
              title: "Easy import/export",
              icon: Upload,
              desc: "Move data in and out when needed.",
            },
          ].map((item) => (
            <Card key={item.title} className="hover-lift">
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
