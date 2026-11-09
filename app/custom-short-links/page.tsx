import Link from "next/link"
import type { Metadata } from "next"
import { ClaimNameForm } from "@/components/claim-name-form"
import { JsonLdScript, pageBreadcrumbs, techArticle } from "@/components/json-ld"
import { StaticPage } from "@/components/static-page"
import { CONTENT_UPDATED } from "@/lib/content-dates"
import { pageMetadata } from "@/lib/seo"

const path = "/custom-short-links"
const title = "Custom short links: hrva.cc/your-name"
const description =
  "Check whether hrva.cc/your-name is free. A custom alias is a short link with a name you pick instead of random characters. The rules for names, and what checking a name does."

export const metadata: Metadata = pageMetadata({ title, description, path, absolute: true })

const articleJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    techArticle({ path, headline: title, description, published: "2026-11-09", modified: CONTENT_UPDATED[path] }),
    pageBreadcrumbs("Custom short links", path),
  ],
}

export default function CustomShortLinksPage() {
  return (
    <StaticPage title="Pick the name of your short link" after={<JsonLdScript data={articleJsonLd} />}>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Type a name to see whether <span className="[overflow-wrap:anywhere]">hrva.cc/your-name</span> is free.
      </p>

      <div className="mt-8 rounded-xl border bg-muted/40 p-5">
        <ClaimNameForm />
      </div>

      <div className="prose-custom">
        <h2 id="what-it-is">What a custom alias is</h2>
        <p>
          A short link normally ends in random characters, like hrva.cc/k3x9Q. A custom alias is a name you choose
          instead, like hrva.cc/menu. You need a free account to create one, and you set the alias when you create the
          link.
        </p>

        <h2 id="rules">The rules</h2>
        <ul>
          <li>1 to 32 letters, numbers, hyphens or underscores.</li>
          <li>Capital letters don&apos;t make a new name: once hrva.cc/karlo exists, Karlo and KARLO are taken too. Opening a link still needs the exact letters, so share it as you created it.</li>
          <li>Names that contain a brand name are refused.</li>
          <li>Some names are reserved for the site itself.</li>
        </ul>

        <h2 id="checking">What checking a name does</h2>
        <p>
          Checking only tells you whether the name is free at that moment. It does not hold the name. Someone else can
          take it before you do, and you find out for certain when you create the link.
        </p>
        <p>
          More about aliases, and how to set one when you shorten a link, is in{" "}
          <Link href="/help/links#custom-aliases">the guide to short links</Link>.
        </p>
      </div>
    </StaticPage>
  )
}
