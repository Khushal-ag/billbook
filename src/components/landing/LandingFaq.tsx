import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function LandingFaq() {
  return (
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
                  We can walk you through a simple setup: business details → parties → products →
                  invoicing.
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
                  a: "Yes — it's designed for owners and small teams who need reliable invoicing and reporting without complex setup.",
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
  );
}
