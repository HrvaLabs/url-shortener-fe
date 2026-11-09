import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, pageBreadcrumbs, reference } from "@/components/json-ld"
import { VerdictCell, type Cell } from "@/components/compare/verdict-cell"
import { StaticPage } from "@/components/static-page"
import { Button } from "@/components/ui/button"
import { FREE_PLANS_COMPARISON } from "@/lib/comparisons"
import { formatContentDate } from "@/lib/content-dates"
import { absoluteUrl, pageMetadata } from "@/lib/seo"

const { path, published, checkedOn, sources } = FREE_PLANS_COMPARISON
const title = "Free URL shorteners with custom domains compared"
const description =
  "What the free plans of hrva.cc, Dub, Short.io, Bitly and Rebrandly include: custom domains, links, click tracking, ads and open source, read from each vendor's own pricing page."

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
    pageBreadcrumbs("Free plans with custom domains", path),
  ],
}

type Vendor = keyof typeof sources

interface Row {
  feature: string
  hrva: Cell
  dub: Cell
  shortio: Cell
  bitly: Cell
  rebrandly: Cell
  sources: Record<Vendor, string>
  links?: Partial<Record<Vendor, { url: string; label: string }>>
}

const rows: Row[] = [
  {
    feature: "Custom domain on the free plan",
    hrva: {
      verdict: "yes",
      note: "A subdomain such as go.example.com. One per account, and up to 20 on approved request, each reviewed by a person. Root domains are not supported.",
    },
    dub: { verdict: "yes", note: "3 custom domains." },
    shortio: { verdict: "yes", note: "5 custom domains. Domain registration fees are not included in the plan." },
    bitly: {
      verdict: "no",
      note: "Branded links, which are links on your own custom domain, start at the Growth plan, $29 a month ($348 annual charge), which also lists a complimentary custom domain.",
    },
    rebrandly: {
      verdict: "yes",
      note: "1 custom domain (shown as Yourbrand.bio) plus the free Rebrand.ly domain. Domains you already own can be connected.",
    },
    sources: {
      dub: "Free plan card",
      shortio: "Free column, Custom domains",
      bitly: "Detailed comparison, Branded Links",
      rebrandly: "Detailed comparison, Connect your domains",
    },
  },
  {
    feature: "Links without a monthly or total cap",
    hrva: { verdict: "yes", note: "Up to 60 links an hour per account." },
    dub: { verdict: "no", note: "25 new links a month." },
    shortio: {
      verdict: "no",
      note: "1,000 branded links in total, issued once and usable over the account's lifetime. Links created through the API or bulk create: 1,000.",
    },
    bitly: { verdict: "no", note: "5 links a month." },
    rebrandly: { verdict: "no", note: "10 links a month." },
    sources: {
      dub: "Free plan card",
      shortio: "Free column, Branded links total",
      bitly: "Free plan card",
      rebrandly: "Free plan card",
    },
  },
  {
    feature: "Click tracking on the free plan",
    hrva: { verdict: "yes", note: "Daily totals per link, with no IP addresses stored." },
    dub: { verdict: "yes", note: "1K tracked events a month, with 30 days of analytics retention." },
    shortio: {
      verdict: "yes",
      note: "50,000 tracked clicks a month. Redirects are unlimited, and the FAQ says detailed statistics are viewable for the first 50,000 clicks.",
    },
    bitly: {
      verdict: "no",
      note: "Clicks are counted, but click and scan history starts at the Core plan, with 30 days.",
    },
    rebrandly: { verdict: "yes", note: "Unlimited clicks and QR code scans. Engagement data covers 100 clicks a month." },
    sources: {
      dub: "Free plan card",
      shortio: "Free column, Tracked clicks and FAQ",
      bitly: "Detailed comparison, Data History",
      rebrandly: "Free plan card and Engagement data",
    },
  },
  {
    feature: "No ads",
    hrva: { verdict: "yes" },
    dub: { verdict: "unknown" },
    shortio: { verdict: "unknown" },
    bitly: { verdict: "no", note: "The Free plan is listed as \"With Ads\"." },
    rebrandly: {
      verdict: "unknown",
      note: "Free plan QR codes and the free link gallery carry a watermark.",
    },
    sources: {
      dub: "Whole page",
      shortio: "Whole page",
      bitly: "Free plan card",
      rebrandly: "Whole page",
    },
  },
  {
    feature: "Open source",
    hrva: { verdict: "yes", note: "Under the GPL-3.0 licence." },
    dub: {
      verdict: "yes",
      note: "The core is under the AGPLv3 licence. A small part, the /ee Enterprise Edition folder, is under a commercial licence.",
    },
    shortio: { verdict: "unknown" },
    bitly: { verdict: "unknown" },
    rebrandly: { verdict: "unknown" },
    links: { dub: { url: "https://github.com/dubinc/dub", label: "Dub on GitHub" } },
    sources: {
      dub: "License section",
      shortio: "Whole page",
      bitly: "Whole page",
      rebrandly: "Whole page",
    },
  },
]

const vendors: { key: Vendor; name: string }[] = [
  { key: "dub", name: "Dub" },
  { key: "shortio", name: "Short.io" },
  { key: "bitly", name: "Bitly" },
  { key: "rebrandly", name: "Rebrandly" },
]

export default function FreeCustomDomainShortenersPage() {
  const checked = formatContentDate(checkedOn)

  return (
    <StaticPage
      title="Free URL shorteners with custom domains compared"
      lead={
        <p>
          This page compares hrva.cc and the free plans of Dub, Short.io, Bitly and Rebrandly. Each competitor
          figure is read from that vendor&apos;s own pricing page. Where a page does not state something, the table says Not stated.
        </p>
      }
      after={<JsonLdScript data={comparisonJsonLd} />}
    >
      <section className="mt-10">
        <h2 id="free-plans-heading" className="font-display text-2xl leading-tight">Free plans, side by side</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Checked on {checked} on the pricing pages of{" "}
          {vendors.map(({ key, name }, index) => (
            <span key={key}>
              {index > 0 ? (index === vendors.length - 1 ? " and " : ", ") : ""}
              <a href={sources[key]} className="text-brand-link">
                {name}
              </a>
            </span>
          ))}
          . They may have changed since.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A tick means the free plan has it. A cross means it does not. A note gives the figure or the condition. Not stated means the vendor&apos;s page does not say.
        </p>
        <table role="table" aria-labelledby="free-plans-heading" className="mt-5 block w-full text-sm lg:table">
          <thead role="rowgroup" className="hidden lg:table-header-group">
            <tr role="row" className="border-b text-left align-top">
              <th scope="col" role="columnheader" className="w-32 py-2 pr-4 font-semibold">Feature</th>
              <th scope="col" role="columnheader" className="py-2 pr-4 font-semibold">hrva.cc</th>
              {vendors.map(({ key, name }) => (
                <th key={key} scope="col" role="columnheader" className="py-2 pr-4 font-semibold">{name} Free</th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="block lg:table-row-group">
            {rows.map((row) => (
              <tr key={row.feature} role="row" className="block border-b py-3 lg:table-row lg:py-0">
                <th scope="row" role="rowheader" className="block pb-1 text-left font-semibold lg:table-cell lg:py-3 lg:pr-4 lg:align-top">
                  {row.feature}
                </th>
                <td role="cell" className="block break-words py-1 leading-relaxed lg:table-cell lg:py-3 lg:pr-4 lg:align-top">
                  <span className="font-medium text-muted-foreground lg:hidden">hrva.cc: </span>
                  <VerdictCell {...row.hrva} />
                </td>
                {vendors.map(({ key, name }) => (
                  <td key={key} role="cell" className="block break-words py-1 leading-relaxed lg:table-cell lg:py-3 lg:pr-4 lg:align-top">
                    <span className="font-medium text-muted-foreground lg:hidden">{name} Free: </span>
                    <VerdictCell {...row[key]}>
                      <a href={row.links?.[key]?.url ?? sources[key]} className="text-xs text-brand-link">
                        {row.links?.[key]?.label ?? `${name} pricing`}
                      </a>
                      <span className="text-xs text-muted-foreground"> ({row.sources[key]})</span>
                    </VerdictCell>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="prose-custom">
        <h2 id="where-others-do-better">Where the others do better</h2>
        <ul>
          <li>
            Dub (3) and Short.io (5) list more custom domains on their free plans than the one subdomain hrva.cc gives each
            account. hrva.cc raises it to up to 20 only on request, after review.
          </li>
          <li>
            Bitly and Rebrandly list unlimited clicks and QR code scans on their free plans. hrva.cc keeps daily totals per
            link.
          </li>
        </ul>

        <h2 id="about-hrva">More about hrva.cc</h2>
        <ul>
          <li>
            There is no paid plan. Setup of a custom domain is one CNAME record to <code>domains.hrva.cc</code>, checked
            automatically. <Link href="/custom-domain-url-shortener">Custom domains on hrva.cc</Link>.
          </li>
          <li>
            The code is public under the GPL-3.0 licence. Who runs hrva.cc and how it is paid for:{" "}
            <Link href="/about">About hrva.cc</Link>.
          </li>
        </ul>
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
