import type { Metadata } from "next";
import LandingClient from "./LandingClient";
import { marketingContactEmail, siteConfig } from "@/lib/site-config";
import { homePageMetadata } from "@/lib/seo-metadata";

interface LandingPageProps {
  searchParams?: Promise<{
    from?: string | string[];
    loggedOut?: string | string[];
  }>;
}

const pageDescription =
  "Create GST invoices, manage customers and vendors, track receipts and stock, export report CSVs and GST / Tax HTML — BillBook for small businesses in India.";

export const metadata: Metadata = homePageMetadata(pageDescription);

function buildLandingJsonLd(contactEmail: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: `${siteConfig.url}/logo.svg`,
        },
        description: siteConfig.description,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: contactEmail,
          availableLanguage: ["English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: "en-IN",
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${siteConfig.url}/`,
        url: `${siteConfig.url}/`,
        name: siteConfig.title,
        description: pageDescription,
        inLanguage: "en-IN",
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#app`,
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: siteConfig.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        featureList: [
          "GST invoices and credit notes",
          "Customer receipts and payouts",
          "Items, stock, and party ledgers",
          "Report registers with CSV download",
          "GST and tax summaries with HTML export",
          "Owner audit logs",
        ],
      },
    ],
  };
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectToValue = resolvedSearchParams?.from;
  const loggedOutValue = resolvedSearchParams?.loggedOut;

  const redirectTo = Array.isArray(redirectToValue) ? redirectToValue[0] : redirectToValue;
  const isLoggingOut = (Array.isArray(loggedOutValue) ? loggedOutValue[0] : loggedOutValue) === "1";

  const jsonLd = buildLandingJsonLd(marketingContactEmail());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient redirectTo={redirectTo} isLoggingOut={isLoggingOut} />
    </>
  );
}
