import type { Metadata } from "next";
import LandingClient from "./LandingClient";
import { siteConfig } from "@/lib/site-config";

interface LandingPageProps {
  searchParams?: Promise<{
    from?: string | string[];
    loggedOut?: string | string[];
  }>;
}

const pageDescription =
  "Create GST invoices, manage parties, track payments, and run your small business effortlessly with BillBook.";

export const metadata: Metadata = {
  // absolute prevents the layout template from appending "| BillBook" again
  title: { absolute: siteConfig.title },
  description: pageDescription,
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
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
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/`,
      url: `${siteConfig.url}/`,
      name: siteConfig.title,
      description: pageDescription,
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
    },
  ],
};

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectToValue = resolvedSearchParams?.from;
  const loggedOutValue = resolvedSearchParams?.loggedOut;

  const redirectTo = Array.isArray(redirectToValue) ? redirectToValue[0] : redirectToValue;
  const isLoggingOut = (Array.isArray(loggedOutValue) ? loggedOutValue[0] : loggedOutValue) === "1";

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
