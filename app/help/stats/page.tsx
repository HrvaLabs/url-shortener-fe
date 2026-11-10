import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description = "What the public numbers mean, what your analytics overview breaks down, and how hrva.cc tells QR scans from other clicks."

export const metadata: Metadata = pageMetadata({ title: "How to read the public stats", description, path: "/help/stats" })

export default function StatsHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">hrva.cc in numbers</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: the hrva.cc in numbers page shows site-wide numbers, most of them for the last 30
                full days. Your own analytics overview breaks clicks down across all your links, and link
                analytics show QR scans apart from other clicks.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="numbers">What the public numbers mean</h2>
              <p>
                <strong>Active links</strong>: how many hrva.cc links work right now.
              </p>
              <p>
                <strong>Links created</strong>: new links made in the last 30 full days.
              </p>
              <p>
                <strong>Clicks</strong>: visits to hrva.cc links in the last 30 full days. Bots and link
                previews aren&apos;t counted. The chart shows clicks per day and ends yesterday, and the
                numbers are refreshed every hour.
              </p>
              <p>
                <strong>Harmful links blocked</strong>: links blocked in the last 30 full days. The line
                under it gives the total since hrva.cc started, counting the links that are still blocked.
                Links refused before they were created aren&apos;t counted, because they were never saved.
              </p>
              <p>
                <strong>Visitor reports handled</strong>: reported links a person reviewed in the last 30
                days. Anyone can <Link href="/report">report a link</Link>.
              </p>
              <p>
                <strong>Average review time</strong>: how long it took, on average, from the moment hrva.cc
                or a visitor flagged a link to a person&apos;s decision, for reviews finished in the last 30
                days. Without any, it says <strong>No reviews in the last 30 days</strong>.
              </p>
              <p>
                <strong>Blocklists in use</strong>: the blocklists hrva.cc checks links against. Each row
                gives the list&apos;s name, whether it blocks links (<strong>Blocks links</strong>) or flags
                them for a person to check (<strong>Flags links for a person to check</strong>), and how many
                domains it has.
              </p>
              <p>
                Nothing on the page is about a single link, person, country or referrer.{" "}
                <Link href="/stats">Open hrva.cc in numbers</Link>.
              </p>

              <h2 id="overview">Your analytics overview</h2>
              <p>
                Sign in and open <Link href="/dashboard/analytics">Analytics</Link> for numbers across all your
                links. Under the clicks chart and your top links, it shows <strong>QR scans and other clicks</strong>,{" "}
                <strong>Referrers</strong>, <strong>Countries</strong>, <strong>Devices</strong>,{" "}
                <strong>Browsers</strong> and <strong>Operating systems</strong> for the range you pick at the
                top. Referrers, countries, devices, browsers and operating systems each list the 10 with the most
                clicks and add the rest together as <strong>Other</strong>.
              </p>
              <p>
                One link&apos;s analytics page has the same lists for that link alone.
              </p>
              <p>
                <strong>URLs</strong> and <strong>Analytics</strong> update by themselves every 10 seconds while
                the page is open, so a new click shows up without a reload, and a visit or click count that went
                up is highlighted for a moment. In a tab you aren&apos;t looking at, the updates pause and catch up when
                you come back.
              </p>
              <p>
                The <strong>Visits</strong> column in URLs counts daily unique visitors, so a second click from
                the same person on the same day doesn&apos;t change it. <strong>Clicks</strong> in Analytics counts
                every click except bots, which <strong>Bot clicks</strong> counts apart.
              </p>

              <h2 id="qr-scans">QR scans and other clicks</h2>
              <ol>
                <li>
                  Sign in and open <strong>URLs</strong>. Next to a link, select the QR code icon (screen
                  readers call it <strong>Show QR code</strong>), then <strong>PNG</strong> or{" "}
                  <strong>SVG</strong>. The create dialog shows a code too, and so does the home page on a
                  larger screen.
                </li>
                <li>
                  The code opens your short link with <code className="whitespace-nowrap">?qr</code> added,
                  such as <code className="[overflow-wrap:anywhere]">hrva.cc/menu?qr</code>. hrva.cc
                  removes <code className="whitespace-nowrap">?qr</code> before sending the visitor on, so
                  the destination never sees it.
                </li>
                <li>
                  Next to the link, select the chart icon (screen readers call it{" "}
                  <strong>View stats</strong>) and look at <strong>QR scans and other clicks</strong>.
                </li>
              </ol>
              <p>
                Codes made by other QR generators, and links that were typed, clicked or pasted, count as other
                clicks. A link with a password counts every visit, scans included, as another click.
              </p>
              <p>Bots and link previews are never counted as scans or clicks.</p>
              <p>
                The free <Link href="/qr">QR code generator</Link> works without an account. Its codes point straight
                at the address you type, so their scans reach hrva.cc only when that address is a hrva.cc short link.
              </p>

              <h2 id="privacy">Privacy</h2>
              <p>
                QR scans are a daily total per link, like referrers and countries. Nothing about the person
                scanning is stored. The <Link href="/privacy">Privacy Policy</Link> describes everything
                hrva.cc stores.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="How to read the public stats" path="/help/stats" />
    </div>
  )
}
