import type { Metadata } from "next";
import Link from "next/link";
import { PublicMarketingShell } from "@/components/landing/PublicMarketingShell";
import { siteConfig } from "@/lib/site-config";
import { publicPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy policy",
  description: `${siteConfig.name} privacy policy: billing data we store, how it is used, security, retention, and updates.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PublicMarketingShell>
      <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8 lg:py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 2026</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <p>
              This policy describes how {siteConfig.name} handles information in typical
              deployments. Your organisation&apos;s administrator may apply additional policies or
              data processing agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">What you provide</h2>
            <p>
              To operate billing workflows, the product stores business details, party records,
              invoices, stock movements, payments, and related metadata you or your team submit.
              Audit logs may record actions for accountability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
            <p>
              Data is used to provide the service: rendering screens, generating PDFs and exports
              you request, and enforcing access rules (for example owner-only audit logs). We do not
              sell your ledger data to advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p>
              Access is gated by authentication. Operators should protect credentials, use strong
              passwords, and follow your organisation&apos;s security practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Retention and deletion</h2>
            <p>
              Retention depends on your deployment configuration and administrator actions. For
              export or deletion requests, contact your workspace admin or use the{" "}
              <Link className="font-medium text-primary hover:underline" href="/contact">
                Contact
              </Link>{" "}
              page for deployment-level questions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Updates</h2>
            <p>
              We may update this policy; the date above will change when we do. Significant changes
              may also be communicated through your administrator.
            </p>
          </section>
        </div>
      </div>
    </PublicMarketingShell>
  );
}
