const defaultSiteUrl = "https://billbook.app";

const normalizedEnvUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

export const siteConfig = {
  name: "BillBook",
  shortName: "BillBook",
  description:
    "BillBook is a simple yet powerful invoicing, billing, and inventory management app for small businesses. Create GST invoices, manage parties, track payments, and more.",
  url: normalizedEnvUrl && normalizedEnvUrl.length > 0 ? normalizedEnvUrl : defaultSiteUrl,
  keywords: [
    "invoice",
    "billing",
    "GST",
    "inventory",
    "small business",
    "accounting",
    "BillBook",
    "credit notes",
    "payments",
    "parties",
  ],
  authors: [{ name: "BillBook" }],
  creator: "BillBook",
  publisher: "BillBook",
  locale: "en_IN",
  ogImage: "/logo.svg",
};
