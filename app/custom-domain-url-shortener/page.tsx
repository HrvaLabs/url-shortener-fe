import Link from "next/link"
import type { Metadata } from "next"
import { JsonLdScript, pageBreadcrumbs, techArticle } from "@/components/json-ld"
import { StaticPage } from "@/components/static-page"
import { CONTENT_UPDATED } from "@/lib/content-dates"
import { DOMAIN_LIMIT_MAX } from "@/lib/domains"
import { pageMetadata } from "@/lib/seo"

const path = "/custom-domain-url-shortener"
const title = "Free URL shortener for your own domain"
const description =
  "Short links on your own subdomain, like go.example.com/menu, for free: apply with an account, a person reviews it, then add one CNAME record. What it takes and what the limits are."

export const metadata: Metadata = pageMetadata({ title, description, path, absolute: true })

const articleJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    techArticle({ path, headline: title, description, published: "2026-11-09", modified: CONTENT_UPDATED[path] }),
    pageBreadcrumbs("URL shortener for your own domain", path),
  ],
}

const faqs = [
  {
    question: "Does it cost anything?",
    answer: "No. Custom domains are free, and hrva.cc has no paid plans.",
  },
  {
    question: "Can I use example.com itself?",
    answer:
      "Not yet. A root domain usually can't have a CNAME record, because it already holds other records, such as the ones for email. Use a subdomain like go.example.com, which leaves your website and email as they are.",
  },
  {
    question: "What happens when I remove the domain?",
    answer:
      "Its links stop working on your domain at once, so printed QR codes and shared links that use it stop working too. You choose whether its links are moved to hrva.cc or turned off.",
  },
]

export default function CustomDomainUrlShortenerPage() {
  return (
    <StaticPage title="A free URL shortener for your own domain" after={<JsonLdScript data={articleJsonLd} />}>
      <div className="mt-8 rounded-xl border bg-muted/40 p-5">
        <p className="leading-7 text-foreground">
          hrva.cc lets you make short links on a subdomain you own, such as go.example.com/menu instead of
          hrva.cc/menu. It is free. You apply from your account, a person reviews the application, and once it is
          approved you add one CNAME record at your DNS provider. hrva.cc checks for the record on its own and sets up
          the https certificate.
        </p>
      </div>

      <div className="prose-custom">
        <h2 id="what-you-get">What you get</h2>
        <p>
          A link made on your domain opens at your domain. If your domain is go.example.com and you pick the alias{" "}
          <code>menu</code>, the short link is <code className="[overflow-wrap:anywhere]">go.example.com/menu</code>.
        </p>
        <ul>
          <li>Stats, visit limits, passwords, expiry, QR codes and the safety checks work the same as on hrva.cc.</li>
          <li>A QR code made for the link opens your domain.</li>
          <li>You can create links on your domain from the web app or, with the API, by sending the domain&apos;s name as <code>domain</code>.</li>
          <li>Visitors get the same privacy as on hrva.cc: daily counts only, and their IP addresses are never stored.</li>
        </ul>

        <h2 id="how-setup-works">How setup works</h2>
        <ol>
          <li>
            <Link href="/register">Create an account</Link>, open Settings and, under Custom domains, enter the
            subdomain and say in a sentence what the links are for.
          </li>
          <li>
            A person reviews every application. The domain shows as waiting for review, and you get an email when it is
            decided, usually within a day or two.
          </li>
          <li>
            Once it is approved, add one CNAME record at the company that manages your domain&apos;s DNS. The type is{" "}
            <code>CNAME</code>, the name is your subdomain, such as <code>go</code>, and the target is{" "}
            <code>domains.hrva.cc</code>.
          </li>
          <li>
            hrva.cc looks for the record by itself: every minute for the first hour after approval, every 10 minutes
            until a day has passed, then every hour. When it sees the record, it gets the certificate and the domain
            becomes active. DNS changes can take up to an hour to show.
          </li>
          <li>Pick your domain when you shorten a link.</li>
        </ol>
        <p>
          If the record never appears, hrva.cc stops looking after 14 days. Once you have added it, a Check now button
          looks again. The steps for Cloudflare, Namecheap, GoDaddy and Porkbun, and what each message means, are in{" "}
          <Link href="/help/custom-domains">the custom domains guide</Link>.
        </p>

        <h2 id="limits">The limits</h2>
        <ul>
          <li>Subdomains only, like go.example.com or links.example.co.uk. Root domains like example.com aren&apos;t supported.</li>
          <li>You need an account. Links made without one can&apos;t use a custom domain.</li>
          <li>
            One custom domain per account. You can ask for more, up to {DOMAIN_LIMIT_MAX} in total. An admin approves or
            declines each request, and one request can wait at a time.
          </li>
          <li>
            Aliases are separate for each domain. go.example.com/menu and hrva.cc/menu can be two different links, and
            hrva.cc/menu may belong to someone else.
          </li>
          <li>A link&apos;s domain is set when you create it and can&apos;t be changed later.</li>
          <li>
            Only short links work on your domain. The root, go.example.com/, opens the hrva.cc home page, and anything
            else answers Not found.
          </li>
          <li>An account can create 60 links an hour, on any of its domains.</li>
          <li>
            The domain must be yours, or one you are allowed to use. An admin can turn a domain off for abuse, and a
            domain on a blocklist is turned off on its own.
          </li>
        </ul>

        <h2 id="public-certificate">What becomes public</h2>
        <p>
          Cloudflare, which issues the certificates for custom domains, receives your domain&apos;s name. Certificates
          are published in public Certificate Transparency logs, so the name becomes public once the domain is set up,
          even if you never share a link. The <Link href="/privacy#custom-domains">privacy policy</Link> says what
          hrva.cc stores about a domain and for how long.
        </p>

        <h2 id="questions">Questions</h2>
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <h2 id="start">Start</h2>
        <p>
          <Link href="/register">Create an account</Link> to apply, or read{" "}
          <Link href="/help/custom-domains">the full guide</Link> first. Who runs hrva.cc is on the{" "}
          <Link href="/about">About page</Link>.
        </p>
      </div>
    </StaticPage>
  )
}
