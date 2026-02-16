import { Link, Navigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  Globe,
  LifeBuoy,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthModal redirectTo={redirectTo} />
      {/* Promo bar */}
      <div className="border-b bg-gradient-to-r from-muted/50 via-muted/30 to-background">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-2 text-xs text-muted-foreground lg:px-8">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Streamline billing, tax, and reporting for your business.
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="transition-opacity hover:opacity-90" aria-label="BillBook home">
              <Logo className="h-9 w-9" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Features
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link to="/?auth=signup">Invoicing & credit notes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/?auth=signup">GST / tax summaries</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/?auth=signup">Audit logs</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Solutions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link to="/?auth=signup">For owners</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/?auth=signup">For teams</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/?auth=signup">For accountants</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button asChild variant="ghost" size="sm">
                <Link to="/?auth=signup">Pricing</Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/?auth=login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/?auth=signup">Book a demo</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/?auth=signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background">
          {/* Background accents */}
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
                Create invoices, manage parties and products, track credit notes, and generate
                tax-ready reports — fast, clean, and consistent.
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
                  <p className="text-xs text-muted-foreground">
                    Track changes with accountability.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Fast operations</p>
                  <p className="text-xs text-muted-foreground">Less clicking, more shipping.</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Export-ready</p>
                  <p className="text-xs text-muted-foreground">
                    Reports you can share confidently.
                  </p>
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
                              <div className="col-span-6 font-medium text-foreground">
                                {row.name}
                              </div>
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

        {/* Feature tabs */}
        <section>
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
                Built for compliance and day-to-day work
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Use focused tools where they matter: filing-ready exports, clean records, and
                predictable workflows.
              </p>
            </div>

            <div className="mt-10">
              <Tabs defaultValue="gst" className="w-full">
                <div className="flex flex-col items-center gap-6">
                  <TabsList className="h-auto flex-wrap">
                    <TabsTrigger value="gst">GST / Tax</TabsTrigger>
                    <TabsTrigger value="einvoice">E-invoicing</TabsTrigger>
                    <TabsTrigger value="eway">E-way billing</TabsTrigger>
                    <TabsTrigger value="export">Export data</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="gst">
                  <div className="mt-6 grid gap-6 motion-safe:animate-fade-in lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Tax summaries</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          View totals by period, track payable amounts, and keep records ready for
                          review.
                        </CardContent>
                      </Card>
                    </div>
                    <div className="lg:col-span-8">
                      <Card className="overflow-hidden">
                        <div className="border-b bg-gradient-to-r from-muted/50 via-muted/30 to-background px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">Tax report (GST-ready)</p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                Feb 2026
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                Filed: Draft
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="rounded-lg border bg-card">
                            <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Report</p>
                                <p className="text-sm font-semibold text-foreground">GST Summary</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">Taxable: ₹ 25,740</Badge>
                                <Badge variant="secondary">GST: ₹ 4,633</Badge>
                                <Badge variant="secondary">Total: ₹ 30,373</Badge>
                              </div>
                            </div>

                            <div className="p-4">
                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-xs text-muted-foreground">Invoices</p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">18</p>
                                </div>
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-xs text-muted-foreground">B2B</p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">11</p>
                                </div>
                                <div className="rounded-md border bg-background p-3">
                                  <p className="text-xs text-muted-foreground">B2C</p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">7</p>
                                </div>
                              </div>

                              <Separator className="my-4" />

                              <div className="rounded-md border bg-card p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">
                                    Invoice register
                                  </p>
                                  <Badge variant="secondary" className="text-[10px]">
                                    Export-ready
                                  </Badge>
                                </div>
                                <Separator className="my-3" />
                                <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground">
                                  <div className="col-span-3">Date</div>
                                  <div className="col-span-4">Party</div>
                                  <div className="col-span-3">Status</div>
                                  <div className="col-span-2 text-right">Value</div>
                                </div>
                                <Separator className="my-2" />
                                {[
                                  { d: "01 Feb", c: "Party A", s: "Paid", v: "₹ 12,300" },
                                  { d: "05 Feb", c: "Party B", s: "Pending", v: "₹ 8,450" },
                                  { d: "12 Feb", c: "Party C", s: "Paid", v: "₹ 4,990" },
                                ].map((r) => (
                                  <div
                                    key={`${r.c}-${r.d}`}
                                    className="grid grid-cols-12 gap-2 rounded-md px-2 py-2 text-xs"
                                  >
                                    <div className="col-span-3 text-foreground">{r.d}</div>
                                    <div className="col-span-4 text-foreground">{r.c}</div>
                                    <div className="col-span-3">
                                      <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                                        {r.s}
                                      </Badge>
                                    </div>
                                    <div className="col-span-2 text-right font-medium text-foreground">
                                      {r.v}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="einvoice">
                  <div className="mt-6 grid gap-6 motion-safe:animate-fade-in lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Structured invoice data</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Maintain consistent invoice fields that can be used for integrations and
                          compliance needs.
                        </CardContent>
                      </Card>
                    </div>
                    <div className="lg:col-span-8">
                      <Card className="overflow-hidden">
                        <div className="border-b bg-gradient-to-r from-muted/50 via-muted/30 to-background px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">Invoice builder</p>
                            <Badge variant="secondary" className="text-[10px]">
                              Preview + JSON
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="grid gap-4 lg:grid-cols-12">
                            <div className="lg:col-span-7">
                              <div className="rounded-lg border bg-card p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">
                                    Invoice details
                                  </p>
                                  <Badge variant="secondary" className="text-[10px]">
                                    INV-1024
                                  </Badge>
                                </div>
                                <Separator className="my-3" />

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-md border bg-background p-3">
                                    <p className="text-[11px] text-muted-foreground">Party</p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                      Party Name
                                    </p>
                                  </div>
                                  <div className="rounded-md border bg-background p-3">
                                    <p className="text-[11px] text-muted-foreground">GST Rate</p>
                                    <p className="mt-1 text-sm font-medium text-foreground">18%</p>
                                  </div>
                                  <div className="rounded-md border bg-background p-3">
                                    <p className="text-[11px] text-muted-foreground">Items</p>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                      3 lines
                                    </p>
                                  </div>
                                  <div className="rounded-md border bg-background p-3">
                                    <p className="text-[11px] text-muted-foreground">Total</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                      ₹ 3,470
                                    </p>
                                  </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="rounded-md border bg-muted/20 p-3">
                                  <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground">
                                    <div className="col-span-6">Item</div>
                                    <div className="col-span-2 text-right">Qty</div>
                                    <div className="col-span-2 text-right">Rate</div>
                                    <div className="col-span-2 text-right">Amt</div>
                                  </div>
                                  <Separator className="my-2" />
                                  {[
                                    { n: "Product A", q: "2", r: "₹ 990", a: "₹ 1,980" },
                                    { n: "Product B", q: "1", r: "₹ 990", a: "₹ 990" },
                                    { n: "Service C", q: "1", r: "₹ 500", a: "₹ 500" },
                                  ].map((row) => (
                                    <div
                                      key={row.n}
                                      className="grid grid-cols-12 gap-2 py-1 text-xs"
                                    >
                                      <div className="col-span-6 text-foreground">{row.n}</div>
                                      <div className="col-span-2 text-right text-foreground">
                                        {row.q}
                                      </div>
                                      <div className="col-span-2 text-right text-muted-foreground">
                                        {row.r}
                                      </div>
                                      <div className="col-span-2 text-right font-medium text-foreground">
                                        {row.a}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-5">
                              <div className="rounded-lg border bg-card p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">
                                    Payload preview
                                  </p>
                                  <Badge variant="secondary" className="text-[10px]">
                                    Structured
                                  </Badge>
                                </div>
                                <Separator className="my-3" />
                                <div className="rounded-md border bg-muted/20 p-3 font-mono text-[11px] text-foreground">
                                  {`{\n  "invoiceNo": "INV-1024",\n  "buyer": "Party Name",\n  "tax": { "rate": 18 },\n  "items": 3,\n  "total": 3470\n}`}
                                </div>
                                <p className="mt-3 text-xs text-muted-foreground">
                                  Keep fields consistent for e-invoice flows and integrations.
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="eway">
                  <div className="mt-6 grid gap-6 motion-safe:animate-fade-in lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Dispatch-ready details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Keep item, quantity, and transport information easy to find when you need
                          it.
                        </CardContent>
                      </Card>
                    </div>
                    <div className="lg:col-span-8">
                      <Card className="overflow-hidden">
                        <div className="border-b bg-gradient-to-r from-muted/50 via-muted/30 to-background px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">Shipment & transport</p>
                            <Badge variant="secondary" className="text-[10px]">
                              Dispatch-ready
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="rounded-lg border bg-card p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-md border bg-background p-3">
                                <p className="text-[11px] text-muted-foreground">Consignee</p>
                                <p className="mt-1 text-sm font-medium text-foreground">
                                  Party Name
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Address, GSTIN, phone
                                </p>
                              </div>
                              <div className="rounded-md border bg-background p-3">
                                <p className="text-[11px] text-muted-foreground">Transport</p>
                                <p className="mt-1 text-sm font-medium text-foreground">Road</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Vehicle no, distance
                                </p>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="rounded-md border bg-muted/20 p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">
                                  Items for dispatch
                                </p>
                                <Badge variant="secondary" className="text-[10px]">
                                  3 lines
                                </Badge>
                              </div>
                              <Separator className="my-2" />
                              <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground">
                                <div className="col-span-6">Item</div>
                                <div className="col-span-2 text-right">Qty</div>
                                <div className="col-span-2 text-right">Weight</div>
                                <div className="col-span-2 text-right">Value</div>
                              </div>
                              <Separator className="my-2" />
                              {[
                                { n: "Product A", q: "2", w: "3.0 kg", v: "₹ 1,980" },
                                { n: "Product B", q: "1", w: "1.5 kg", v: "₹ 990" },
                                { n: "Service C", q: "1", w: "—", v: "₹ 500" },
                              ].map((row) => (
                                <div key={row.n} className="grid grid-cols-12 gap-2 py-1 text-xs">
                                  <div className="col-span-6 text-foreground">{row.n}</div>
                                  <div className="col-span-2 text-right text-foreground">
                                    {row.q}
                                  </div>
                                  <div className="col-span-2 text-right text-muted-foreground">
                                    {row.w}
                                  </div>
                                  <div className="col-span-2 text-right font-medium text-foreground">
                                    {row.v}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="export">
                  <div className="mt-6 grid gap-6 motion-safe:animate-fade-in lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Export & share</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          Download your data for backups, reconciliation, or review workflows.
                        </CardContent>
                      </Card>
                    </div>
                    <div className="lg:col-span-8">
                      <Card className="overflow-hidden">
                        <div className="border-b bg-gradient-to-r from-muted/50 via-muted/30 to-background px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">Exports & backups</p>
                            <Badge variant="secondary" className="text-[10px]">
                              One-click downloads
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="grid gap-4 lg:grid-cols-12">
                            <div className="lg:col-span-7">
                              <div className="grid gap-3 sm:grid-cols-3">
                                <Card className="border-dashed">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Invoices</CardTitle>
                                  </CardHeader>
                                  <CardContent className="text-xs text-muted-foreground">
                                    CSV / Excel-ready
                                  </CardContent>
                                </Card>
                                <Card className="border-dashed">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Parties</CardTitle>
                                  </CardHeader>
                                  <CardContent className="text-xs text-muted-foreground">
                                    Contacts & GSTINs
                                  </CardContent>
                                </Card>
                                <Card className="border-dashed">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Products</CardTitle>
                                  </CardHeader>
                                  <CardContent className="text-xs text-muted-foreground">
                                    Rates & tax slabs
                                  </CardContent>
                                </Card>
                              </div>

                              <Separator className="my-4" />

                              <div className="rounded-md border bg-card p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">
                                    Recent exports
                                  </p>
                                  <Badge variant="secondary" className="text-[10px]">
                                    History
                                  </Badge>
                                </div>
                                <Separator className="my-3" />
                                <div className="space-y-2">
                                  {[
                                    { t: "Invoices", d: "17 Feb 2026", s: "Ready" },
                                    { t: "GST Summary", d: "12 Feb 2026", s: "Ready" },
                                    { t: "Products", d: "05 Feb 2026", s: "Ready" },
                                  ].map((row) => (
                                    <div
                                      key={`${row.t}-${row.d}`}
                                      className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-foreground">
                                          {row.t}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{row.d}</p>
                                      </div>
                                      <Badge variant="secondary" className="text-[10px]">
                                        {row.s}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-5">
                              <div className="rounded-lg border bg-card p-4">
                                <p className="text-sm font-medium text-foreground">
                                  What you can export
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Use exports for backups, reconciliation, or sharing with your
                                  accountant.
                                </p>
                                <Separator className="my-3" />
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">Invoices</Badge>
                                  <Badge variant="secondary">Credit notes</Badge>
                                  <Badge variant="secondary">Parties</Badge>
                                  <Badge variant="secondary">Products</Badge>
                                  <Badge variant="secondary">Reports</Badge>
                                </div>
                                <div className="mt-4 grid gap-2">
                                  <Button size="sm" variant="outline" asChild>
                                    <Link to="/?auth=signup">Download sample export</Link>
                                  </Button>
                                  <Button size="sm" asChild>
                                    <Link to="/?auth=signup">Start exporting</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* Value grid */}
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

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* FAQ */}
        <section>
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Frequently asked questions
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Clear answers to common questions from business owners.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-base">Need help deciding?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      We can walk you through a simple setup: business details → parties → products
                      → invoicing.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Owners</Badge>
                      <Badge variant="secondary">Teams</Badge>
                      <Badge variant="secondary">Accountants</Badge>
                    </div>
                    <div className="grid gap-2 pt-2">
                      <Button asChild size="sm">
                        <Link to="/?auth=signup">Start free</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/?auth=signup">Book a demo</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-8">
                <div className="space-y-3">
                  {[
                    {
                      q: "Is this built for small teams?",
                      a: "Yes — it’s designed for owners and small teams who need reliable invoicing and reporting without complex setup.",
                    },
                    {
                      q: "Can I create GST invoices and see tax totals?",
                      a: "Yes — invoices and reports are structured to keep taxable value and GST totals clear for review and reconciliation.",
                    },
                    {
                      q: "Can I manage parties (customers) and products in one place?",
                      a: "Yes — keep parties, GSTIN/contact details, products, and tax slabs organized so invoicing stays consistent.",
                    },
                    {
                      q: "Do you support credit notes and adjustments?",
                      a: "Yes — issue credit notes and keep your records aligned when invoices need corrections or returns.",
                    },
                    {
                      q: "Can multiple team members use the same business account?",
                      a: "Yes — you can collaborate as a team and keep workflows consistent across users.",
                    },
                    {
                      q: "Can I export data for my accountant?",
                      a: "Yes — export invoices, parties, products, and reports to share with your accountant or maintain backups.",
                    },
                    {
                      q: "Does it support audit logs?",
                      a: "Yes — audit logs help track changes in key areas so you can review activity and reduce ambiguity.",
                    },
                    {
                      q: "Is my data secure and private?",
                      a: "We focus on secure-by-default workflows and clear access boundaries so day-to-day operations stay controlled.",
                    },
                    {
                      q: "Can I download my data anytime?",
                      a: "Yes — exports are designed for portability, reconciliation, and keeping your own records.",
                    },
                    {
                      q: "Will it work on mobile?",
                      a: "Yes — the UI is responsive so you can review invoices and reports comfortably on smaller screens.",
                    },
                    {
                      q: "How do I get started?",
                      a: "Create an account, add business details, then add parties/products and start invoicing. You can refine templates and reports later.",
                    },
                  ].map((faq) => (
                    <details key={faq.q} className="group rounded-lg border bg-card px-4 py-4">
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{faq.q}</p>
                            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                              Tap to expand
                            </p>
                          </div>
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition-transform group-open:rotate-180">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </summary>
                      <Separator className="my-3" />
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-muted/10">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Logo className="h-9 w-9" />
                <p className="mt-3 text-sm text-muted-foreground">
                  A clean billing and GST workflow for day-to-day operations.
                </p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm">
                    <Link to="/?auth=signup">Start free</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/?auth=login">Sign in</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Product</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Invoicing
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Reports
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Audit logs
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Company</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Terms
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Privacy
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Support</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Help centre
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Contact
                      </Link>
                    </li>
                    <li>
                      <Link className="hover:text-foreground" to="/?auth=signup">
                        Book a demo
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} BillBook</span>
              <span>Professional, minimal, and built for B2B.</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
