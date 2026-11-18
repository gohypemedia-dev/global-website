import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

// Main public pages, listed so search engines can show them as sitelinks under the home result.
const PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/products", priority: 0.9 },
  { path: "/products/railway-barrier", priority: 0.9 },
  { path: "/products/earth-leakage", priority: 0.9 },
  { path: "/products/gi-boom", priority: 0.8 },
  { path: "/products/motorised-locking", priority: 0.8 },
  { path: "/products/ancillary-items", priority: 0.7 },
  { path: "/capability", priority: 0.7 },
  { path: "/about", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/downloads", priority: 0.8 },
  { path: "/downloads/electric-lifting-barrier", priority: 0.6 },
  { path: "/downloads/earth-leakage-detector", priority: 0.6 },
  { path: "/downloads/company-documents", priority: 0.6 },
  { path: "/scan-qr-code", priority: 0.6 },
  { path: "/msme-declaration", priority: 0.3 },
  { path: "/privacy-policy", priority: 0.2 },
  { path: "/terms-of-use", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority }));
}
