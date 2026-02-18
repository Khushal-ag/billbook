import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LandingFeatureTabs() {
  return (
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
              </div>
            </TabsContent>

            <TabsContent value="einvoice">
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Structured invoice data for integration and compliance.
              </div>
            </TabsContent>

            <TabsContent value="eway">
              <div className="mt-6 text-center text-sm text-muted-foreground">
                E-way bill support for interstate movement.
              </div>
            </TabsContent>

            <TabsContent value="export">
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Export invoices, reports, and data for accounting.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
