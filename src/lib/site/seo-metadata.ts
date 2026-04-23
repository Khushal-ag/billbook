import type { Metadata } from "next";
import { siteConfig } from "@/lib/site/site-config";

const OG_IMAGE_PATH = "/opengraph-image";
const OG_SIZE = { width: 1200, height: 630 } as const;

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Default OG/Twitter image (matches `src/app/opengraph-image.tsx`). */
export function defaultOgImages(): NonNullable<Metadata["openGraph"]>["images"] {
  return [
    {
      url: absoluteUrl(OG_IMAGE_PATH),
      ...OG_SIZE,
      alt: siteConfig.title,
    },
  ];
}

export function defaultTwitterImageUrl(): string {
  return absoluteUrl(OG_IMAGE_PATH);
}

/**
 * Rich metadata for indexable marketing pages: canonical, Open Graph, Twitter.
 */
export function publicPageMetadata(opts: {
  title: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  const { title, description, path } = opts;
  const url = absoluteUrl(path);
  const fullTitle = `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: defaultOgImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [defaultTwitterImageUrl()],
    },
  };
}

/**
 * Auth/marketing shell routes that immediately redirect (e.g. `/login` → `/?auth=login`).
 * Keeps titles consistent and avoids indexing redirect endpoints.
 */
export function authRedirectPageMetadata(pageTitle: string): Metadata {
  const description = `${pageTitle} — ${siteConfig.name}. You will be redirected to complete this action.`;
  return {
    title: { absolute: `${pageTitle} | ${siteConfig.name}` },
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

/** Home page: absolute title (no template suffix). */
export function homePageMetadata(homeDescription: string): Metadata {
  return {
    title: { absolute: siteConfig.title },
    description: homeDescription,
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      title: siteConfig.title,
      description: homeDescription,
      url: absoluteUrl("/"),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: defaultOgImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.title,
      description: homeDescription,
      images: [defaultTwitterImageUrl()],
    },
  };
}
