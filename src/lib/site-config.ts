const defaultSiteUrl = "https://billbook-hench.vercel.app";

const normalizedEnvUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

export const siteConfig = {
  name: "BillBook",
  shortName: "BillBook",
  title: "BillBook \u2013 Invoicing & Billing Management",
  description:
    "BillBook is a simple yet powerful invoicing, billing, and inventory management app for small businesses. Create GST invoices, manage parties, track payments, and more.",
  url: normalizedEnvUrl && normalizedEnvUrl.length > 0 ? normalizedEnvUrl : defaultSiteUrl,
  keywords: [
    "invoice",
    "billing",
    "GST invoice",
    "GST billing software",
    "GST invoice software India",
    "online invoicing India",
    "billing software for small business",
    "inventory management",
    "small business accounting",
    "free invoicing software India",
    "credit notes",
    "payment tracking",
    "party management",
    "tax invoice",
    "BillBook",
    "audit logs",
    "business reports",
    "e-invoice",
    "accounts receivable",
    "GST return",
  ],
  authors: [{ name: "BillBook" }],
  creator: "BillBook",
  publisher: "BillBook",
  locale: "en_IN",
  ogImage: "/logo.svg",
};
