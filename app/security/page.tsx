import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, SOURCE_REPOSITORIES, pageBreadcrumbs, reference } from "@/components/json-ld"
import { StaticPage, SummaryBox } from "@/components/static-page"
import { CONTENT_UPDATED, formatContentDate } from "@/lib/content-dates"
import { absoluteUrl, pageMetadata } from "@/lib/seo"

const path = "/security"
const description =
  "What hrva.cc checks and protects: the links people open, accounts, API keys and connected apps, the site itself, and how to report a vulnerability."

export const metadata: Metadata = pageMetadata({ title: "Security", description, path })

const LAST_UPDATED = formatContentDate(CONTENT_UPDATED[path])
const SECURITY_TXT = "https://hrva.cc/.well-known/security.txt"

const securityJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(path)}#webpage`,
      url: absoluteUrl(path),
      name: "Security",
      description,
      inLanguage: "en",
      dateModified: CONTENT_UPDATED[path],
      about: reference(JSON_LD_IDS.app),
      isPartOf: reference(JSON_LD_IDS.website),
    },
    pageBreadcrumbs("Security", path),
  ],
}

export default function SecurityPage() {
  return (
    <StaticPage title="Security" after={<JsonLdScript data={securityJsonLd} />}>
      <p className="mt-3 text-sm tabular-nums text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <SummaryBox>
        This page lists what hrva.cc checks and protects. To report a vulnerability, write to{" "}
        <a href="mailto:abuse@hrva.cc" className="text-brand-link">abuse@hrva.cc</a>. To report a harmful link, use
        the <Link href="/report" className="text-brand-link">report form</Link>.
      </SummaryBox>

      <div className="prose-custom">
        <h2 id="links">Links people open</h2>
        <p>Before a short link sends someone on, hrva.cc checks where it goes.</p>
        <ul>
          <li>
            Every destination is checked against Google Safe Browsing and public blocklists and security DNS filters when the link is made, and
            again while the link is active. A link to a known harmful site is refused, or stops working.
          </li>
          <li>Every click is checked against blocklists too, so a destination listed later stops working on the next click.</li>
          <li>Where a destination redirects is followed, and every address along the way is checked as well.</li>
          <li>
            A web address passed on in a short link&apos;s query is checked on each click too, and isn&apos;t passed
            on if it would be blocked. Links made without an account pass nothing on.
          </li>
          <li>Links to other URL shorteners are followed to where they end, and that address gets the same checks. Links to hrva.cc itself are refused.</li>
          <li>
            Some links made without an account open a warning page first. It shows the full destination, a Continue
            button and a way to report the link.
          </li>
          <li>
            The destination page of some of those links, and of links made, repointed or turned back on from an
            account, is opened once to see whether it asks for a password or card details. If it does, an admin checks
            the link, and the link can be held until then; visitors are told the link is being checked. For links
            from an account, the page isn&apos;t opened when hrva.cc already trusts the destination&apos;s domain.
          </li>
          <li>
            On links from an account, a sign-in page on one of the most-visited sites in the{" "}
            <a href="https://tranco-list.eu/" target="_blank" rel="noopener noreferrer">Tranco list</a> doesn&apos;t
            count. hrva.cc downloads the list to its own server and sends Tranco nothing about you or your links.
          </li>
          <li>The buttons on bio pages are short links, and get the same checks.</li>
          <li>
            A link&apos;s destination can change only after the same checks as a new link, and every change is
            recorded. Turning an expired or used-up link back on runs the same checks as a new link.
          </li>
          <li>A link&apos;s password is stored as a hash, and wrong guesses are limited.</li>
          <li>
            Links the checks are unsure about go to a review queue, and a person decides what happens to them. The
            checks never block an account on their own.
          </li>
          <li>
            Anyone can report a link or a bio page on the <Link href="/report">report form</Link>. A report goes to
            the review queue; it never takes a link down by itself.
          </li>
        </ul>
        <p>
          <Link href="/stats">hrva.cc in numbers</Link> shows how many harmful links were blocked and how fast reports
          are reviewed. The <Link href="/privacy">privacy policy</Link> says what these checks send and to
          whom.
        </p>

        <h2 id="accounts">Accounts</h2>
        <ul>
          <li>Passwords are stored as bcrypt hashes, never as text.</li>
          <li>
            You can sign in with Google or GitHub instead of a password, or with a passkey. A Google or GitHub sign-in
            can only be finished in the browser that started it.
          </li>
          <li>
            Two-step sign-in works with an authenticator app, a passkey or security key, and one-time recovery codes,
            whether you sign in with a password, Google or GitHub. Recovery codes are stored as hashes.
          </li>
          <li>Admin pages need two-step sign-in. An admin account without it has no admin access.</li>
          <li>
            <strong>Sign out everywhere</strong> in Settings ends every other sign-in. Changing or resetting your
            password, or turning a sign-in method off, does the same.
          </li>
          <li>Sign-in attempts are limited per network and per account, and wrong two-step codes per account, against guessing.</li>
          <li>A password reset link works once, expires after 1 hour, and is stored only as a hash.</li>
          <li>Signing up and asking for a password reset give the same answer whether or not an account uses the address.</li>
          <li>You get an email when a passkey is added to your account or a sign-in method changes.</li>
          <li>
            Only you, and an admin who uses two-step sign-in, can change your links or see their analytics. Anyone who
            has a short link can see where it goes and how many times it has been opened.
          </li>
          <li>Admin actions, changes to sign-in methods and changes to where a link points are recorded in an audit log.</li>
        </ul>
        <p>
          The <Link href="/help/passkeys">passkeys guide</Link> explains two-step sign-in, recovery codes and what to do
          if you lose a device.
        </p>

        <h2 id="api-keys">API keys and connected apps</h2>
        <ul>
          <li>An API key is shown once, when you make it. hrva.cc stores a hash of it and its first characters.</li>
          <li>You choose when a key expires: after 1 to 3,650 days, or never.</li>
          <li>
            Each key has an hourly request limit (see <Link href="/developers#limits">rate limits</Link>).
          </li>
          <li>Revoking a key is final. A revoked key can&apos;t be turned back on, only deleted.</li>
          <li>
            AI apps connected through the <Link href="/mcp">MCP connector</Link> can be disconnected in Settings,
            under Connected apps, and stop working at once.
          </li>
          <li>
            The screen where you allow an app shows where it will send you, and warns when an app uses another
            app&apos;s name. When an app is connected to your account for the first time, you get an email.
          </li>
        </ul>

        <h2 id="site">The site itself</h2>
        <ul>
          <li>hrva.cc and app.hrva.cc answer only over HTTPS. Plain HTTP is redirected, and browsers are told to keep using HTTPS.</li>
          <li>
            app.hrva.cc sends a content security policy with every page. It limits where scripts, frames and
            connections can come from, and no other site can show hrva.cc in a frame.
          </li>
          <li>
            The API refuses every request unless the route is public or the caller is signed in. A test checks every
            endpoint against the list of public ones.
          </li>
          <li>
            When the server fetches an address someone gave it, such as a link&apos;s destination or a webhook, it
            connects only to public internet addresses, never to a private or internal network.
          </li>
          <li>
            GitHub CodeQL scans the code of both repositories on every change and every week, and Dependabot proposes
            dependency updates.
          </li>
          <li>
            The code is open source under the GPL-3.0 licence: the{" "}
            <a href={SOURCE_REPOSITORIES[0]}>backend</a> and the{" "}
            <a href={SOURCE_REPOSITORIES[1]}>web app</a>.
          </li>
        </ul>

        <h2 id="report">Reporting a vulnerability</h2>
        <p>
          Write to <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a>. The same address is in hrva.cc&apos;s{" "}
          <a href={SECURITY_TXT} className="[overflow-wrap:anywhere]">security.txt</a>. Please include:
        </p>
        <ul>
          <li>what you found, and which address or API endpoint it affects</li>
          <li>the steps to reproduce it</li>
          <li>what someone could do with it</li>
        </ul>
        <p>
          Test only with your own account and links. To report a short link or a bio page that leads somewhere
          harmful, use the <Link href="/report">report form</Link> instead.
        </p>
      </div>
    </StaticPage>
  )
}
