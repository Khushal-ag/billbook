import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, ArrowRight } from "lucide-react";
import { PublicMarketingShell } from "@/components/landing/PublicMarketingShell";
import { marketingContactEmail, siteConfig } from "@/lib/site-config";
import { publicPageMetadata } from "@/lib/seo-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = publicPageMetadata({
  title: "Contact",
  description: `Contact ${siteConfig.name} for product questions, rollout help, and partnerships. We respond by email.`,
  path: "/contact",
});

export default function ContactPage() {
  const email = marketingContactEmail();
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(`${siteConfig.name} inquiry`)}`;

  return (
    <PublicMarketingShell>
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-muted/40 via-background to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground">
            Let&apos;s talk
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
            Product questions, rollout support, or a walkthrough of Reports and GST / Tax — send a
            note and we&apos;ll respond from the address below.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-12 lg:px-8 lg:py-20">
        <div className="lg:col-span-5">
          <h2 className="text-lg font-semibold text-foreground">Before you write</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              Already have an account? Billing and access for your workspace are usually fastest
              through your organisation&apos;s admin.
            </li>
            <li>
              Exploring the product? Start free — the app matches what you see on the{" "}
              <Link className="font-medium text-primary hover:underline" href="/">
                home page
              </Link>{" "}
              and the{" "}
              <Link className="font-medium text-primary hover:underline" href="/#features">
                features
              </Link>{" "}
              section.
            </li>
          </ul>
          <Button asChild className="mt-8" size="lg">
            <Link href="/?auth=signup">
              Create account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="lg:col-span-7">
          <Card className="overflow-hidden border-border/80 shadow-lg ring-1 ring-black/[0.04]">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <p className="text-sm text-muted-foreground">
                Use your work email and a short context (company size, current tools, what you want
                to validate). We read every message.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href={mailHref}>
                    <Mail className="mr-2 h-4 w-4" />
                    {email}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicMarketingShell>
  );
}
