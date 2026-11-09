import { Logo } from "@/components/logo"
import { NavLink } from "@/components/nav-link"
import { BITLY_COMPARISON } from "@/lib/comparisons"
import { EntitySentence } from "@/components/entity-sentence"

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/link-in-bio", label: "Bio pages" },
      { href: "/qr", label: "QR code generator" },
      { href: "/utm", label: "UTM builder" },
      { href: "/custom-domain-url-shortener", label: "Your own domain" },
      ...(BITLY_COMPARISON.published ? [{ href: BITLY_COMPARISON.path, label: "Bitly alternative" }] : []),
      { href: "/validate", label: "Check a link" },
      { href: "/stats", label: "Public stats" },
      { href: "/changelog", label: "Changelog" },
      { href: "https://status.hrva.cc/status/url", label: "Status", external: true },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "/developers", label: "API quickstart" },
      { href: "https://hrva.cc/swagger-ui/index.html", label: "API docs", external: true },
      { href: "/mcp", label: "AI connector (MCP)" },
      { href: "/dashboard/api-keys", label: "API keys" },
      { href: "https://github.com/HrvaLabs/url-shortener", label: "Source on GitHub", external: true },
    ],
  },
  {
    title: "Help & legal",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy-first-url-shortener", label: "How visits are counted" },
      { href: "/help", label: "Help" },
      { href: "/report", label: "Report abuse" },
      { href: "/about#support", label: "Support" },
      { href: "/blog", label: "Blog" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/security", label: "Security" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              <EntitySentence linkClassName="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground" />
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <NavLink
                        href={link.href}
                        prefetch={false}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                      >
                        {link.label}
                      </NavLink>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2022–{new Date().getFullYear()} hrva.cc · A{" "}
            <a href="https://hrvalabs.net/" className="underline-offset-4 hover:text-foreground hover:underline">
              HrvaLabs
            </a>{" "}
            project
          </p>
          <p>No ads and no third-party trackers.</p>
        </div>
      </div>
    </footer>
  )
}
