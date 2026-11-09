import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description =
  "Guides to hrva.cc: bio pages, campaign tracking (UTM), passkeys and two-step sign-in, notifications and webhooks, custom domains, links made without an account, installing it as an app, and what the public numbers mean."

export const metadata: Metadata = pageMetadata({ title: "Help", description, path: "/help" })

const guides = [
  {
    href: "/help/links",
    title: "Short links and API keys",
    description: "How random aliases, choosing your own alias, editing links, turning them back on, changing where they point, links being checked, visit limits, query strings and API keys work.",
  },
  {
    href: "/help/utm",
    title: "Campaign tracking (UTM)",
    description: "Add UTM tags to a link so your analytics tool can see where visitors came from.",
  },
  {
    href: "/help/passkeys",
    title: "Passkeys and security keys",
    description: "Sign in without a password, use a passkey or security key as your second step, passwords and reset links, and sign out everywhere.",
  },
  {
    href: "/help/stats",
    title: "hrva.cc in numbers",
    description: "What the public numbers mean: active links, clicks, harmful links blocked and review times.",
  },
  {
    href: "/help/stats#qr-scans",
    title: "QR scans and other clicks",
    description: "How hrva.cc counts scans of its QR codes, and why older printed codes count as other clicks.",
  },
  {
    href: "/help/link-in-bio",
    title: "Bio pages",
    description: "One page with all your links at hrva.cc/@yourname, for your Instagram, TikTok or any other bio.",
  },
  {
    href: "/help/notifications",
    title: "Notifications and webhooks",
    description: "Dead-link checks, the weekly summary, and alerts to Discord, Slack, Telegram, ntfy, a webhook or email.",
  },
  {
    href: "/help/custom-domains",
    title: "Custom domains",
    description: "Use your own subdomain, like go.example.com, for your short links, with the exact DNS record for common providers.",
  },
  {
    href: "/help/links-without-an-account",
    title: "Links without an account",
    description: "What happens when you make a link without signing in.",
  },
  {
    href: "/help/install-app",
    title: "Install hrva.cc as an app",
    description: "Install it on Android, iPhone or a computer, and share links to it from other Android apps.",
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Help</h1>
            <p className="mt-3 text-muted-foreground">{description}</p>

            <ul className="mt-8 divide-y rounded-xl border bg-card">
              {guides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{guide.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{guide.description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Help" path="/help" />
    </div>
  )
}
