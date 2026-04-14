const defaultSiteUrl = "https://billbook-henchsolutions.vercel.app";

const normalizedEnvUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

export const siteConfig = {
  name: "BillBook",
  shortName: "BillBook",
  title: "BillBook \u2013 Invoicing & Billing Management",
  description:
    "BillBook is invoicing and billing software for small businesses in India: GST invoices, credit notes, receipts, stock, customer and vendor balances, CSV reports, GST / Tax HTML export, and audit logs.",
  url: normalizedEnvUrl && normalizedEnvUrl.length > 0 ? normalizedEnvUrl : defaultSiteUrl,
  keywords: [
    "BillBook",
    "GST invoice software India",
    "billing software India",
    "invoicing software small business",
    "online invoicing India",
    "credit notes",
    "GST reports",
    "accounts receivable",
    "accounts payable",
    "invoice PDF",
    "customer accounts",
    "stock management",
    "receipts and payments",
    "invoice register CSV",
    "GST tax summary",
    "audit logs",
    "small business billing",
  ],
  authors: [{ name: "BillBook" }],
  creator: "BillBook",
  publisher: "BillBook",
  locale: "en_IN",
  ogImage: "/logo.svg",
};

/**
 * Public marketing contact (mailto on /contact). Set `NEXT_PUBLIC_CONTACT_EMAIL`
 * in production; otherwise a sensible default for the Hench Solutions org.
 */
const MARKETING_CONTACT_FALLBACK = "it@henchsolutions.com";

export function marketingContactEmail(): string {
  const v = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return v && v.length > 0 ? v : MARKETING_CONTACT_FALLBACK;
}
