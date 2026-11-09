import type { MetadataRoute } from "next"

const PRIVATE_PATHS = ["/dashboard/", "/admin/", "/api/", "/egg", "/connect"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: "https://app.hrva.cc/sitemap.xml",
  }
}
