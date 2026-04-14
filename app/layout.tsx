import type { Metadata } from "next";
import { Rethink_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Rethink_Sans({ subsets: ["latin"], display: "swap", preload: false, fallback: ["system-ui", "Arial", "sans-serif"] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://skolastik.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Skolastik School Solutions — Uganda's #1 School Management Platform",
    template: "%s | Skolastik School Solutions",
  },
  description:
    "Skolastik is Uganda's all-in-one school management platform — academics, fees, report cards, timetables, payroll, and parent communication in one place.",
  keywords: [
    "school management system Uganda",
    "school ERP Uganda",
    "student management system",
    "fee management school",
    "report card generation",
    "timetable generator",
    "school software Uganda",
    "Skolastik",
  ],
  authors: [{ name: "Skolastik School Solutions", url: BASE_URL }],
  creator: "Skolastik School Solutions",
  publisher: "Skolastik School Solutions",
  openGraph: {
    type: "website",
    locale: "en_UG",
    url: BASE_URL,
    siteName: "Skolastik School Solutions",
    title: "Skolastik School Solutions — Uganda's #1 School Management Platform",
    description:
      "All-in-one school management — academics, fees, report cards, timetables, payroll, and parent communication.",
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "Skolastik School Solutions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skolastik School Solutions",
    description: "Uganda's all-in-one school management platform.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@skolastik",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Skolastik School Solutions",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "Uganda's all-in-one school management platform for secondary schools.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "UGX" },
  author: {
    "@type": "Organization",
    name: "Skolastik School Solutions",
    url: BASE_URL,
    address: { "@type": "PostalAddress", addressCountry: "UG", addressLocality: "Kampala" },
    contactPoint: { "@type": "ContactPoint", email: "hello@skolastik.com", contactType: "customer support" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
