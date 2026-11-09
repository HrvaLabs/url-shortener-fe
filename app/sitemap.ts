import type { MetadataRoute } from "next"
import { blogPosts } from "@/content/blog/posts"
import { CONTENT_UPDATED, type DatedPath } from "@/lib/content-dates"
import { BITLY_COMPARISON, FREE_PLANS_COMPARISON } from "@/lib/comparisons"
import { absoluteUrl } from "@/lib/seo"

const dated = (path: DatedPath): MetadataRoute.Sitemap[number] => ({
  url: absoluteUrl(path),
  lastModified: CONTENT_UPDATED[path],
})

export default function sitemap(): MetadataRoute.Sitemap {
  const newestPost = blogPosts.map((post) => post.updated ?? post.date).sort().at(-1)

  return [
    dated("/"),
    { url: absoluteUrl("/blog"), lastModified: newestPost },
    ...blogPosts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.updated ?? post.date })),
    { url: absoluteUrl("/changelog") },
    { url: absoluteUrl("/stats") },
    dated("/about"),
    dated("/privacy-first-url-shortener"),
    dated("/custom-domain-url-shortener"),
    dated("/custom-short-links"),
    dated("/developers"),
    dated("/qr"),
    dated("/utm"),
    dated("/link-in-bio"),
    ...(BITLY_COMPARISON.published ? [{ url: absoluteUrl(BITLY_COMPARISON.path), lastModified: BITLY_COMPARISON.checkedOn }] : []),
    ...(FREE_PLANS_COMPARISON.published
      ? [{ url: absoluteUrl(FREE_PLANS_COMPARISON.path), lastModified: FREE_PLANS_COMPARISON.checkedOn }]
      : []),
    dated("/mcp"),
    dated("/validate"),
    dated("/help"),
    dated("/help/links"),
    dated("/help/utm"),
    dated("/help/passkeys"),
    dated("/help/stats"),
    dated("/help/link-in-bio"),
    dated("/help/notifications"),
    dated("/help/install-app"),
    dated("/help/custom-domains"),
    dated("/help/links-without-an-account"),
    dated("/report"),
    dated("/privacy"),
    dated("/terms"),
    dated("/security"),
  ]
}
