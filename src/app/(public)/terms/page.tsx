import type { Metadata } from "next";
import Link from "next/link";
import { PublicMarketingShell } from "@/components/landing/PublicMarketingShell";
import { siteConfig } from "@/lib/site-config";
import { publicPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of use",
  description: `${siteConfig.name} terms of use: acceptable use, data you enter, availability, and updates.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PublicMarketingShell>
      <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8 lg:py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Terms of use</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <p>
              These terms govern access to the {siteConfig.name} web application and related
              marketing sites operated by your deployment owner. They are a concise baseline; your
              organisation may supplement them with separate agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Use of the service</h2>
            <p>
              You agree to use {siteConfig.name} only for lawful business purposes and in line with
              any access rules set by your workspace administrator. You are responsible for activity
              under your credentials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data and accuracy</h2>
            <p>
              You are responsible for the accuracy of invoices, parties, tax rates, and other data
              you enter. Reports and exports reflect that data; {siteConfig.name} does not provide
              legal, tax, or accounting advice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Availability</h2>
            <p>
              We aim for reliable operation but do not guarantee uninterrupted access. Maintenance,
              third-party infrastructure, or force majeure may affect availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Changes</h2>
            <p>
              We may update these terms or the product. Material changes will be reflected on this
              page with an updated date. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p>
              For questions about these terms, use the{" "}
              <Link className="font-medium text-primary hover:underline" href="/contact">
                Contact
              </Link>{" "}
              page.
            </p>
          </section>
        </div>
      </div>
    </PublicMarketingShell>
  );
}
