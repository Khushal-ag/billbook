import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  LayoutGrid,
  LifeBuoy,
  MessageCircle,
} from "lucide-react";
import { PublicMarketingShell } from "@/components/landing/PublicMarketingShell";
import { siteConfig } from "@/lib/site/site-config";
import { publicPageMetadata } from "@/lib/site/seo-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = publicPageMetadata({
  title: "Help centre",
  description: `${siteConfig.name} help: feature tour on the home page, FAQ, contact, and how invoices, reports, and GST / Tax work in the app.`,
  path: "/help",
});

const LINKS = [
  {
    title: "Interactive feature tour",
    desc: "Scroll the home page tabs for invoices, stock, reports, and GST / Tax — they mirror the product.",
    href: "/#features",
    icon: LayoutGrid,
    cta: "Open features",
  },
  {
    title: "Frequently asked questions",
    desc: "Billing scope, GST, credit notes, exports, audit logs, and getting started.",
    href: "/#faq",
    icon: HelpCircle,
    cta: "Read FAQ",
  },
  {
    title: "What’s included",
    desc: "Invoices, stock, reports, GST / Tax, and exports — same modules as in the app sidebar.",
    href: "/#features",
    icon: BookOpen,
    cta: "See features",
  },
  {
    title: "Contact the team",
    desc: "Email us for demos, partnerships, or deployment questions.",
    href: "/contact",
    icon: MessageCircle,
    cta: "Contact",
  },
];

export default function HelpPage() {
  return (
    <PublicMarketingShell>
      <div className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <h1 className="mt-6 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-foreground">
            Help centre
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
            Everything here points at real pages — no placeholder links back to signup for answers
            you actually need.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/?auth=signup">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map(({ title, desc, href, icon: Icon, cta }) => (
            <Card
              key={href}
              className="group border-border/80 transition-all hover:border-primary/20 hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild variant="ghost" className="px-0 text-primary hover:bg-transparent">
                  <Link href={href}>
                    {cta}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 border-dashed bg-muted/15">
          <CardContent className="p-6 text-sm text-muted-foreground sm:p-8">
            <p>
              Signed-in users: use <strong className="text-foreground">Settings</strong> and your
              workspace admin for account-specific issues. This help centre is for public
              orientation and sales questions.
            </p>
          </CardContent>
        </Card>
      </div>
    </PublicMarketingShell>
  );
}
