import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function LandingHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="motion-safe:animate-float-slower absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="motion-safe:animate-float-slow absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-chart-4/10 blur-3xl" />
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-chart-2/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-12 lg:px-8 lg:py-20">
        <div className="lg:col-span-6">
          <Badge variant="secondary" className="mb-4 motion-safe:animate-fade-in">
            Built for B2B workflows
          </Badge>
          <h1 className="animation-delay-200 text-balance text-4xl font-semibold tracking-tight text-foreground motion-safe:animate-fade-in sm:text-5xl">
            Make billing feel <span className="gradient-text">effortless</span>.
          </h1>
          <p className="animation-delay-400 mt-4 text-pretty text-base text-muted-foreground motion-safe:animate-fade-in sm:text-lg">
            Create invoices, manage parties and products, track credit notes, and generate tax-ready
            reports — fast, clean, and consistent.
          </p>

          <div className="animation-delay-400 mt-8 flex flex-col gap-3 motion-safe:animate-fade-in sm:flex-row">
            <Button asChild size="lg" className="shadow-sm transition-shadow hover:shadow-md">
              <Link to="/?auth=signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/?auth=login">Sign in</Link>
            </Button>
          </div>

          <div className="animation-delay-400 mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground motion-safe:animate-fade-in">
            <span className="mr-1">Loved for:</span>
            <Badge variant="secondary">Fast invoicing</Badge>
            <Badge variant="secondary">GST-ready exports</Badge>
            <Badge variant="secondary">Audit logs</Badge>
            <Badge variant="secondary">Mobile-friendly</Badge>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Clean audit trails</p>
              <p className="text-xs text-muted-foreground">Track changes with accountability.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Fast operations</p>
              <p className="text-xs text-muted-foreground">Less clicking, more shipping.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Export-ready</p>
              <p className="text-xs text-muted-foreground">Reports you can share confidently.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <Card className="motion-safe:animate-scale-in overflow-hidden shadow-sm">
            <div className="border-b bg-gradient-to-r from-accent/10 via-muted/40 to-background px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Invoice preview</p>
                <Badge variant="secondary" className="text-[10px]">
                  Sample
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="rounded-md border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">TAX INVOICE</p>
                        <p className="mt-1 text-sm font-semibold">Business Name</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Invoice #</p>
                        <p className="text-sm font-medium">INV-1024</p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Bill to</p>
                        <p className="mt-1 font-medium text-foreground">Party Name</p>
                        <p className="text-muted-foreground">GSTIN / Phone</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Date</p>
                        <p className="mt-1 font-medium text-foreground">17 Feb 2026</p>
                        <p className="text-muted-foreground">Due</p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground">
                        <div className="col-span-6">Item</div>
                        <div className="col-span-2 text-right">Qty</div>
                        <div className="col-span-2 text-right">Tax</div>
                        <div className="col-span-2 text-right">Amount</div>
                      </div>
                      {[
                        { name: "Product A", qty: "2", tax: "18%", amt: "₹ 1,980" },
                        { name: "Product B", qty: "1", tax: "18%", amt: "₹ 990" },
                        { name: "Service C", qty: "1", tax: "0%", amt: "₹ 500" },
                      ].map((row) => (
                        <div
                          key={row.name}
                          className="grid grid-cols-12 gap-2 rounded-md bg-muted/30 px-2 py-2 text-[11px]"
                        >
                          <div className="col-span-6 font-medium text-foreground">{row.name}</div>
                          <div className="col-span-2 text-right text-foreground">{row.qty}</div>
                          <div className="col-span-2 text-right text-foreground">{row.tax}</div>
                          <div className="col-span-2 text-right font-medium text-foreground">
                            {row.amt}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold text-foreground">₹ 3,470</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="space-y-3">
                    <Card className="border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Business details</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        Add your logo, address, GSTIN, and invoice notes.
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Customize templates</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        Keep formats consistent across your team.
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Export reports</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        Share summaries with your accountant.
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
