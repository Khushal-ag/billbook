import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

const publicRoutes = ["/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
