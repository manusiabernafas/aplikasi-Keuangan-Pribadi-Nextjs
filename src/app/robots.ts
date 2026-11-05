import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: ["/", "/syarat", "/privasi"], disallow: ["/api/", "/admin", "/dasbor", "/undangan/", "/dev/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
