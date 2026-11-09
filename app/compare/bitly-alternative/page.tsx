import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, pageBreadcrumbs, reference } from "@/components/json-ld"
import { VerdictCell, type Cell } from "@/components/compare/verdict-cell"
import { StaticPage } from "@/components/static-page"
import { Button } from "@/components/ui/button"
import { BITLY_COMPARISON } from "@/lib/comparisons"
import { formatContentDate } from "@/lib/content-dates"
import { absoluteUrl, pageMetadata } from "@/lib/seo"

const { path, published, checkedOn, sources } = BITLY_COMPARISON
const title = "Free Bitly alternative without tracking"
const description =
  "A free Bitly alternative with no ads and no visitor tracking: how hrva.cc compares with Bitly's Free plan on links, aliases, QR codes, bio pages, the API and what is stored about clicks."

export const metadata: Metadata = {
  ...pageMetadata({ title, description, path }),
  ...(published ? {} : { robots: { index: false, follow: false } }),
}

const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(path)}#webpage`,
      url: absoluteUrl(path),
      name: title,
      description,
      inLanguage: "en",
      dateModified: checkedOn,
      about: reference(JSON_LD_IDS.app),
      isPartOf: reference(JSON_LD_IDS.website),
    },
    pageBreadcrumbs("Bitly alternative", path),
  ],
}

type Source = keyof typeof sources

interface Row {
  feature: string
  hrva: Cell
  bitly: Cell
  source: Source
}

const rows: Row[] = [
  {
    feature: "No paid plans",
    hrva: { verdict: "yes", note: "Free. There are no paid plans." },
    bitly: { verdict: "no", note: "Free plan at $0. Paid plans start at $10 a month, billed annually ($120 a year)." },
    source: "pricing",
  },
  {
    feature: "No ads",
    hrva: { verdict: "yes" },
    bitly: { verdict: "no", note: "The Free plan is listed as \"With Ads\"." },
    source: "pricing",
  },
  {
    feature: "Links without a monthly or total cap",
    hrva: { verdict: "yes", note: "Creating links is rate-limited per hour." },
    bitly: { verdict: "no", note: "5 links a month on the Free plan." },
    source: "pricing",
  },
  {
    feature: "Custom aliases without a monthly cap",
    hrva: { verdict: "yes", note: "With a free account." },
    bitly: { verdict: "no", note: "3 custom back-halves a month on the Free plan." },
    source: "pricing",
  },
  {
    feature: "QR codes without a monthly cap",
    hrva: { verdict: "yes", note: "A QR code when you create a link, which you can download as PNG or SVG, and a QR code generator that needs no account." },
    bitly: { verdict: "no", note: "2 QR codes a month on the Free plan." },
    source: "pricing",
  },
  {
    feature: "Link in bio on the free plan",
    hrva: { verdict: "yes", note: "One bio page per account, with up to 30 buttons." },
    bitly: { verdict: "yes", note: "2 custom landing pages." },
    source: "pricing",
  },
  {
    feature: "API on the free plan",
    hrva: {
      verdict: "yes",
      note: "Each key can make 600 requests an hour by default, and your API keys page shows how many it has made.",
    },
    bitly: { verdict: "yes", note: "1,000 API requests a month." },
    source: "pricing",
  },
  {
    feature: "No IP addresses stored for clicks",
    hrva: { verdict: "yes", note: "Daily totals per link. Nothing about a single click." },
    bitly: {
      verdict: "no",
      note: "Its privacy policy lists the IP address and the location derived from it, referring websites, the time and date of each access, device settings such as browser, operating system and language, cookies and mobile advertising identifiers.",
    },
    source: "privacy",
  },
  {
    feature: "Custom domain on the free plan",
    hrva: {
      verdict: "yes",
      note: "A subdomain such as go.example.com. One per account, and up to 20 on approved request, each reviewed by a person.",
    },
    bitly: { verdict: "no", note: "Growth plan, $29 a month billed annually, which includes a custom domain." },
    source: "pricing",
  },
  {
    feature: "Team accounts on the free plan",
    hrva: { verdict: "no", note: "Not available. One account per person." },
    bitly: { verdict: "no", note: "Multiple users and group permissions are on the Enterprise plan, with custom pricing." },
    source: "pricing",
  },
]

const sourceLabels: Record<Source, string> = {
  pricing: "Bitly pricing",
  privacy: "Bitly privacy policy",
}

export default function BitlyAlternativePage() {
  const checked = formatContentDate(checkedOn)

  return (
    <StaticPage
      title="A free Bitly alternative without ads or visitor tracking"
      lead={
        <p>
          hrva.cc is a free, open-source URL shortener with no paid plans and no ads. Compared with Bitly&apos;s Free plan,
          it has no monthly cap on links, custom aliases or QR codes, and it keeps only daily totals about clicks, with no
          IP addresses. Bitly is the better choice when you need a team account or its integrations.
        </p>
      }
      after={<JsonLdScript data={comparisonJsonLd} />}
    >
      <section className="mt-10">
        <h2 id="comparison-heading" className="font-display text-2xl leading-tight">hrva.cc and Bitly&apos;s Free plan, side by side</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bitly&apos;s facts were checked on {checked} on its <a href={sources.pricing} className="text-brand-link">pricing page</a>{" "}
          and in its <a href={sources.privacy} className="text-brand-link">privacy policy</a>. They may have changed since.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A tick means the free plan has it. A cross means it does not. A note gives the figure or the condition. Not stated means the vendor&apos;s page does not say.
        </p>
        <table role="table" aria-labelledby="comparison-heading" className="mt-5 block w-full text-sm sm:table">
          <thead role="rowgroup" className="hidden sm:table-header-group">
            <tr role="row" className="border-b text-left">
              <th scope="col" role="columnheader" className="w-40 py-2 pr-4 font-semibold">Feature</th>
              <th scope="col" role="columnheader" className="py-2 pr-4 font-semibold">hrva.cc</th>
              <th scope="col" role="columnheader" className="py-2 font-semibold">Bitly Free plan</th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="block sm:table-row-group">
            {rows.map((row) => (
              <tr key={row.feature} role="row" className="block border-b py-3 sm:table-row sm:py-0">
                <th scope="row" role="rowheader" className="block pb-1 text-left font-semibold sm:table-cell sm:py-3 sm:pr-4 sm:align-top">
                  {row.feature}
                </th>
                <td role="cell" className="block py-1 leading-relaxed sm:table-cell sm:py-3 sm:pr-4 sm:align-top">
                  <span className="font-medium text-muted-foreground sm:hidden">hrva.cc: </span>
                  <VerdictCell {...row.hrva} />
                </td>
                <td role="cell" className="block py-1 leading-relaxed sm:table-cell sm:py-3 sm:align-top">
                  <span className="font-medium text-muted-foreground sm:hidden">Bitly Free plan: </span>
                  <VerdictCell {...row.bitly}>
                    <a href={sources[row.source]} className="whitespace-nowrap text-xs text-brand-link">
                      {sourceLabels[row.source]}
                    </a>
                  </VerdictCell>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="prose-custom">
        <h2 id="bitly-better">When Bitly is the better choice</h2>
        <ul>
          <li>
            You want short links on a root domain such as yourbrnd.co. hrva.cc custom domains are subdomains only, such as
            go.example.com, and every domain application is reviewed by a person.
          </li>
          <li>Several people need to share one account with permissions. hrva.cc accounts are for one person.</li>
          <li>
            You rely on its extras, such as integrations with other apps, mobile deep linking, browser extensions and mobile
            apps, which its pricing page lists.
          </li>
        </ul>

        <h2 id="why-hrva">More about hrva.cc</h2>
        <ul>
          <li>
            Visits are counted without tracking visitors: daily totals, a one-way hash with a key that changes every day,
            and no stored IP addresses. <Link href="/privacy-first-url-shortener">How visits are counted</Link>.
          </li>
          <li>
            The code is public under the GPL-3.0 licence. Who runs hrva.cc and how it is paid for:{" "}
            <Link href="/about">About hrva.cc</Link>.
          </li>
          <li>
            Shortening works without an account, and the <Link href="/qr">QR code generator</Link> and{" "}
            <Link href="/utm">UTM builder</Link> do too.
          </li>
          <li>
            An <Link href="/developers">API</Link> and an <Link href="/mcp">MCP server</Link> for Claude and ChatGPT are free.
          </li>
        </ul>

        <h2 id="moving">Moving links over</h2>
        <p>
          Links you already shared on bit.ly stay with Bitly; hrva.cc can&apos;t take them over. Use hrva.cc for new links,
          and recreate the ones you still share. To recreate many at once, send each destination to the{" "}
          <Link href="/developers">API</Link> with an API key, choosing a custom alias for each if you like.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/#shorten">Shorten a link</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Create a free account</Link>
        </Button>
      </div>
    </StaticPage>
  )
}
