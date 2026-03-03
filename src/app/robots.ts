import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/robots.txt", "/sitemap.xml"],
        disallow: [
          "/api/*",
          "/login",
          "/signup",
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
          "/subscription",
          "/tax",
          "/vendors",
        ],
      },
    ],
    host: siteConfig.url,
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
