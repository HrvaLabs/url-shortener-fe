import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, SOURCE_REPOSITORIES, pageBreadcrumbs, reference } from "@/components/json-ld"
import { EntitySentence } from "@/components/entity-sentence"
import { StaticPage, SummaryBox } from "@/components/static-page"
import { Button } from "@/components/ui/button"
import { AUTHOR_NAME, AUTHOR_URL, PUBLISHER_URL, absoluteUrl, pageMetadata } from "@/lib/seo"

const description =
  "About hrva.cc: a free, open-source URL shortener from HrvaLabs. Who runs it and how it's paid for."

export const metadata: Metadata = pageMetadata({ title: "About hrva.cc: who runs this free URL shortener", description, path: "/about", absolute: true })

const supportLinks = [
  { href: "https://hrva.cc/revolut", label: "Revolut" },
  { href: "https://hrva.cc/paypal", label: "PayPal" },
]

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${absoluteUrl("/about")}#aboutpage`,
      url: absoluteUrl("/about"),
      name: "About hrva.cc",
      description,
      inLanguage: "en",
      mainEntity: reference(JSON_LD_IDS.organization),
      about: reference(JSON_LD_IDS.app),
      isPartOf: reference(JSON_LD_IDS.website),
    },
    pageBreadcrumbs("About", "/about"),
  ],
}

export default function AboutPage() {
  return (
    <StaticPage title="About hrva.cc" after={<JsonLdScript data={aboutJsonLd} />}>
      <SummaryBox>
        <EntitySentence linkClassName="text-brand-link" />
      </SummaryBox>

      <div className="prose-custom">
        <h2 id="who">Who runs it</h2>
        <p>
          hrva.cc is a non-commercial hobby project of <a href="https://hrvalabs.net/">HrvaLabs</a>, run since 2022 by{" "}
          <a href={AUTHOR_URL} rel="author">{AUTHOR_NAME}</a>, a software engineer from Zagreb. There is no company,
          team or investor behind it. The code is on{" "}
          <a href="https://github.com/karlohrvacic">GitHub</a>.
        </p>
        <p>
          hrva.cc is also the domain the other <a href={PUBLISHER_URL}>HrvaLabs</a> apps live under, such as garage.hrva.cc
          and gableci.hrva.cc.
        </p>

        <h2 id="why">Why it works the way it does</h2>
        <p>
          Counting visits doesn&apos;t require knowing who your visitors are, so hrva.cc doesn&apos;t keep that. Link
          statistics are daily totals, unique visitors are counted with a one-way hash under a key that changes every
          day, and visitors&apos; IP addresses are never stored (<Link href="/privacy-first-url-shortener">how visits are counted</Link>). Shortening works without an account, and a free account
          adds custom aliases, visit limits, expiry dates, passwords, analytics, API keys, bio pages and notifications.
        </p>

        <h2 id="money">How it is paid for</h2>
        <p>
          It isn&apos;t a business. There are no paid plans and no ads, there are no third-party trackers, and personal
          data is not sold. The <Link href="/terms">terms of use</Link> say it is provided free of charge and as is.
        </p>

        <h2 id="where">Where it runs</h2>
        <p>
          The API, its database and its cache run on Oracle Cloud in Frankfurt, Germany (EU). The web app and the short
          links are delivered through Cloudflare. The <Link href="/privacy">privacy policy</Link> lists every service
          that handles data for hrva.cc, and what each one sees.
        </p>

        <h2 id="open">Code, status and changes</h2>
        <ul>
          <li>
            Source code, under the GPL-3.0 licence: the <a href={SOURCE_REPOSITORIES[0]}>backend</a> and the{" "}
            <a href={SOURCE_REPOSITORIES[1]}>web app</a>.
          </li>
          <li>
            Uptime and incidents: the <a href="https://status.hrva.cc/status/url">status page</a>.
          </li>
          <li>
            What changed and when: the <Link href="/changelog">changelog</Link>.
          </li>
          <li>
            Site-wide totals, harmful links blocked and review times: <Link href="/stats">hrva.cc in numbers</Link>.
          </li>
        </ul>

        <h2 id="support">Support hrva.cc</h2>
        <p>If it&apos;s useful to you, you can support it.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {supportLinks.map((link) => (
          <Button key={link.href} asChild variant="outline">
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </Button>
        ))}
      </div>

      <div className="prose-custom">
        <h2 id="contact">Contact</h2>
        <p>
          For anything about your data, write to <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a>. To
          report a short link or a bio page that leads somewhere harmful, use the <Link href="/report">report form</Link>{" "}
          or write to <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a>. Reports go to a person. For help with
          your account, a link or a custom domain, write to <a href="mailto:support@hrva.cc">support@hrva.cc</a>.
        </p>
      </div>
    </StaticPage>
  )
}
