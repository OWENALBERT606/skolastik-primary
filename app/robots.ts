import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://skolastik.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/forgot-password"],
        // Block all authenticated portal routes from indexing
        disallow: [
          "/dashboard/",
          "/school/*/teacher/",
          "/school/*/dos/",
          "/school/*/bursar/",
          "/school/*/settings/",
          "/school/*/finance/",
          "/school/*/academics/",
          "/school/*/users/",
          "/school/*/staff/",
          "/school/*/communication/",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
