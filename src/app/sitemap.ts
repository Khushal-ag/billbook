import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site/site-config";

const origin = siteConfig.url.replace(/\/$/, "");

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const entries: Array<{
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/help", changeFrequency: "weekly", priority: 0.85 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.85 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Omit `lastModified` unless tied to real content updates — a build-timestamp would churn on every deploy.
  return entries.map(({ path, changeFrequency, priority }) => ({
    url: `${origin}${path}`,
    changeFrequency,
    priority,
  }));
}
