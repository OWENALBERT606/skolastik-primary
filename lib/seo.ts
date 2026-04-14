// lib/seo.ts — Shared SEO helpers

import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://skolastik.com";
const SITE_NAME = "Skolastik School Solutions";
const DEFAULT_DESCRIPTION =
  "Skolastik is Uganda's all-in-one school management platform — academics, fees, report cards, timetables, payroll, and parent communication in one place.";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      type: "website",
      locale: "en_UG",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

export { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION };
