import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCtaBanner() {
  return (
    <section className="relative overflow-hidden border-t bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 text-center lg:px-8">
        <p className="text-sm font-semibold text-primary">Ready to get started?</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Start billing smarter today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Create your first invoice in under 2 minutes. No credit card, no complicated setup — just
          clean, GST-ready billing from day one.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="shadow-sm transition-shadow hover:shadow-md">
            <Link href="/?auth=signup">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/?auth=signup">Book a demo</Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required · Cancel anytime · GST-ready from day 1
        </p>
      </div>
    </section>
  );
}
