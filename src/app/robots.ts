import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

function siteOrigin(): string {
  return siteConfig.url.replace(/\/$/, "");
}

function siteHost(): string | undefined {
  try {
    return new URL(siteConfig.url).host;
  } catch {
    return undefined;
  }
}

/**
 * Allow crawling of public marketing routes; block app, API, and auth shells.
 * Use `allow: "/"` so crawlers are not limited to an explicit URL whitelist.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/admin",
          "/forgot-password",
          "/audit-logs",
          "/credit-notes",
          "/dashboard",
          "/invoices",
          "/items",
          "/parties",
          "/profile",
          "/reports",
          "/settings",
          "/stock",
          "/tax",
          "/vendors",
          "/receipts",
          "/payments",
        ],
      },
    ],
    host: siteHost(),
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
