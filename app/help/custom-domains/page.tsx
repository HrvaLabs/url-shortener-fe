import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"
import {
  DOMAIN_PROBLEM_FOLLOW_UPS,
  DOMAIN_STATUSES,
  DOMAIN_STATUS_HINTS,
  DOMAIN_STATUS_LABELS,
  DOMAIN_STEP_LABELS,
  LINK_MODE_HINTS,
  LINK_MODE_LABELS,
  PROVISIONING_FAILED_TEXT,
  PROVISIONING_GAVE_UP_TEXT,
  USE_AGAIN_HINTS,
  USE_AGAIN_LABEL,
  USE_AGAIN_PENDING_LINE,
  DOMAIN_LIMIT_MAX,
  DOMAIN_REQUEST_STATUS_LABELS,
  domainLimitLine,
} from "@/lib/domains"
import type { CustomDomainStatus, DomainProblem } from "@/lib/types"

const description =
  "Use your own subdomain for hrva.cc short links: who can apply, the DNS record to add at common providers, what each status means, how to remove a domain and how to use a removed one again."

export const metadata: Metadata = pageMetadata({ title: "Custom domains", description, path: "/help/custom-domains" })

const SETTINGS_HREF = "/dashboard/settings#custom-domains"

const EXAMPLE_IDN = `stra${String.fromCodePoint(0xdf)}e`

const EXAMPLE_IDN_ASCII = "go.xn--strae-oqa.de"

const EMOJI_REFUSAL = "Emoji and symbol domains can't be used. Use a domain made of letters and digits."

const PROBLEM_TEXTS: Record<Exclude<DomainProblem, "PROVISIONING_FAILED">, string> = {
  DNS_NOT_FOUND: "We can't see the CNAME record yet. DNS changes can take up to an hour.",
  CAA_BLOCKED: "Your domain's CAA records don't allow our certificate authority. Add a CAA record for pki.goog, or remove your CAA records.",
  CERTIFICATE_TIMED_OUT: "The certificate couldn't be issued in time. Check the CNAME record; we'll try again.",
  CNAME_REMOVED: "The CNAME record for this domain is gone, so its links stopped working. Add the record again.",
  CLOUDFLARE_BLOCKED: "This domain can't be set up. We've been told and will look into it.",
  DNS_TIMED_OUT: "We waited 14 days and never saw the CNAME record, so we stopped checking. Add the record, then select Check now.",
}

const HELP_STATUS_HINTS: Partial<Record<CustomDomainStatus, string>> = {
  AWAITING_DNS: "Add the CNAME record shown on the card. We check every minute at first, then less often, and finish on our own.",
}

const DISABLED_REASONS = ["Turned off because the account was blocked.", "Turned off because the domain is on a blocklist."]

function Quote({ children }: { children: React.ReactNode }) {
  return <strong className="[overflow-wrap:anywhere]">{children}</strong>
}

interface ProblemProps {
  title: string
  problem: Exclude<DomainProblem, "PROVISIONING_FAILED">
  children: React.ReactNode
}

function Problem({ title, problem, children }: ProblemProps) {
  return (
    <>
      <h3>{title}</h3>
      <p>
        The card says <Quote>{PROBLEM_TEXTS[problem]}</Quote>
      </p>
      {children}
      <p>
        Under it: <Quote>{DOMAIN_PROBLEM_FOLLOW_UPS[problem]}</Quote>
      </p>
    </>
  )
}

export default function CustomDomainsHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Custom domains</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: open <strong>Settings</strong> and find <strong>Custom domains</strong>. Apply with a
                subdomain you own, like go.example.com, and say what you&apos;ll use it for. A person reviews it.
                Once it&apos;s approved, add one CNAME record at your DNS provider, and hrva.cc does the rest. Then
                pick the domain when you shorten a link. It&apos;s free. What you get and the limits are also
                summarised on <Link href="/custom-domain-url-shortener">short links on your own domain</Link>.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="who-can-apply">Who can apply</h2>
              <ul>
                <li>Anyone with a hrva.cc account, once signed in. Custom domains are free.</li>
                <li>
                  One custom domain per account. At the limit, the card says{" "}
                  <Quote>{domainLimitLine(1)}</Quote>
                </li>
                <li id="more-domains">
                  To ask for more, select <strong>Request more domains</strong> on the card, say how many you need in
                  total (up to {DOMAIN_LIMIT_MAX}) and what they&apos;re for, and select <strong>Send request</strong>. An admin
                  approves or declines it, and you get an email either way. The card shows the request as{" "}
                  <Quote>{DOMAIN_REQUEST_STATUS_LABELS.WAITING}</Quote>, <Quote>{DOMAIN_REQUEST_STATUS_LABELS.APPROVED}</Quote>{" "}
                  or <Quote>{DOMAIN_REQUEST_STATUS_LABELS.DECLINED}</Quote>, with the admin&apos;s note if there is one. One
                  request can wait at a time, and <strong>Withdraw request</strong> takes it back while it waits. After a
                  decline you can ask again.
                </li>
                <li>
                  A person reviews each application before anything is set up.
                </li>
                <li>
                  Subdomains only, like go.example.com or links.example.co.uk. Root domains like example.com
                  aren&apos;t supported yet; <a href="#why-no-root">here&apos;s why</a>.
                </li>
                <li>
                  The domain must be yours, or one you&apos;re allowed to use. The{" "}
                  <Link href="/terms">Terms of Use</Link> have the rules.
                </li>
              </ul>
              <p>
                If the card says <Quote>Custom domains aren&apos;t available right now.</Quote>, new applications
                are paused. Domains that are already set up keep working.
              </p>

              <h2 id="apply">Apply</h2>
              <ol>
                <li>
                  Sign in and open <Link href={SETTINGS_HREF}>Settings</Link>. Find <strong>Custom domains</strong>,
                  and under it <strong>Apply for a domain</strong>.
                </li>
                <li>
                  In <strong>Domain</strong>, enter the subdomain, such as <code>go.example.com</code>. Capitals
                  and a dot at the end don&apos;t matter.
                </li>
                <li>
                  In <strong>What will you use it for?</strong>, say in a sentence what the links are for, such as{" "}
                  <code>Menu links for my cafe</code>. Up to 300 characters.
                </li>
                <li>
                  Select <strong>Apply</strong>. It says{" "}
                  <Quote>Application sent. We&apos;ll email you when it&apos;s reviewed.</Quote>, and the domain shows
                  as <strong>{DOMAIN_STATUS_LABELS.PENDING_REVIEW}</strong>.
                </li>
              </ol>
              <p>
                We email you when it&apos;s reviewed. An approval has the DNS record to add and a link to the steps
                below. If it isn&apos;t approved, the email says so, with the admin&apos;s note when there is one.
                A note also shows on the card as <strong>Note from the admin</strong>. Changed your mind? Select{" "}
                <strong>Withdraw application</strong> while it&apos;s waiting for review.
              </p>
              <p>
                A domain with letters beyond a to z can be typed as it is, with one exception. If it has a letter
                like the &szlig; in {EXAMPLE_IDN}, enter it in the <code className="whitespace-nowrap">xn--</code> form your registrar shows, such
                as <code className="[overflow-wrap:anywhere]">{EXAMPLE_IDN_ASCII}</code>. hrva.cc converts typed
                international names with an older standard, and browsers use a newer one, so for these letters
                the two would give different names. Domains with emoji or symbols can&apos;t be used; the form
                says <Quote>{EMOJI_REFUSAL}</Quote>
              </p>

              <h2 id="add-the-record">Add the DNS record</h2>
              <p>
                Once it&apos;s approved, the card shows the record to add, with <strong>Copy</strong> buttons for
                the name and the target. Add one CNAME record where your domain&apos;s DNS is managed, often at
                the company you bought the domain from:
              </p>
              <ul>
                <li>
                  <strong>Type</strong>: <code>CNAME</code>
                </li>
                <li>
                  <strong>Name</strong>: <code>go.example.com</code>, or just <code>go</code>. Many providers
                  add the rest of the domain themselves; the card says which part to use.
                </li>
                <li>
                  <strong>Target</strong>: <code>domains.hrva.cc</code>
                </li>
                <li>
                  <strong>TTL</strong>: automatic, or <code>300</code>
                </li>
              </ul>
              <p>
                That&apos;s the only record. If the name already has a record, such as an A record or another
                CNAME, delete it first: a name with a CNAME can&apos;t have any other record.
              </p>

              <h3 id="cloudflare">Cloudflare</h3>
              <ol>
                <li>
                  In the Cloudflare dashboard, open your domain, then <strong>DNS</strong>, then{" "}
                  <strong>Records</strong>.
                </li>
                <li>
                  Select <strong>Add record</strong>.
                </li>
                <li>
                  <strong>Type</strong>: <code>CNAME</code>. <strong>Name</strong>: <code>go</code>.{" "}
                  <strong>Target</strong>: <code>domains.hrva.cc</code>.
                </li>
                <li>
                  Set <strong>Proxy status</strong> to <strong>DNS only</strong> (grey cloud), not proxied
                  (orange cloud).
                </li>
                <li>
                  Select <strong>Save</strong>.
                </li>
              </ol>

              <h3 id="namecheap">Namecheap</h3>
              <ol>
                <li>
                  Open <strong>Domain List</strong>, select <strong>Manage</strong> next to your domain, then open{" "}
                  <strong>Advanced DNS</strong>.
                </li>
                <li>
                  Select <strong>Add new record</strong> and choose <strong>CNAME Record</strong>.
                </li>
                <li>
                  <strong>Host</strong>: <code>go</code>. <strong>Value</strong>: <code>domains.hrva.cc.</code>{" "}
                  (with the dot at the end).
                </li>
                <li>Save the record.</li>
              </ol>

              <h3 id="godaddy">GoDaddy</h3>
              <ol>
                <li>
                  Open <strong>My Products</strong>, then <strong>DNS</strong> next to your domain.
                </li>
                <li>
                  Select <strong>Add New Record</strong>.
                </li>
                <li>
                  <strong>Type</strong>: <code>CNAME</code>. <strong>Name</strong>: <code>go</code>.{" "}
                  <strong>Value</strong>: <code>domains.hrva.cc</code>.
                </li>
                <li>Save the record.</li>
              </ol>

              <h3 id="porkbun">Porkbun</h3>
              <ol>
                <li>
                  Open <strong>Domain Management</strong>, then <strong>DNS</strong> next to your domain.
                </li>
                <li>
                  <strong>Type</strong>: <code>CNAME</code>. <strong>Host</strong>: <code>go</code>.{" "}
                  <strong>Answer</strong>: <code>domains.hrva.cc</code>.
                </li>
                <li>Add the record.</li>
              </ol>
              <p>
                Other providers have the same fields under names like Host, Name or Alias, and Value, Points to or
                Target.
              </p>
              <p>
                Then wait. While the card is open it updates by itself, and <strong>Check now</strong> looks right
                away. DNS changes usually show up within minutes, and can take up to an hour.
              </p>

              <h2 id="statuses">What each status means</h2>
              <ul>
                {DOMAIN_STATUSES.map((status) => (
                  <li key={status}>
                    <strong>{DOMAIN_STATUS_LABELS[status]}</strong>: {HELP_STATUS_HINTS[status] ?? DOMAIN_STATUS_HINTS[status]}
                  </li>
                ))}
              </ul>
              <p>
                While it&apos;s <strong>{DOMAIN_STATUS_LABELS.AWAITING_DNS}</strong>, the card ticks off two steps:{" "}
                <strong>{DOMAIN_STEP_LABELS.dnsFound}</strong>, once your CNAME record is seen, and{" "}
                <strong>{DOMAIN_STEP_LABELS.certificateIssued}</strong>, once the certificate for https is ready.
                When both are done, the domain is <strong>{DOMAIN_STATUS_LABELS.ACTIVE}</strong>. Under them,{" "}
                <strong>Last checked</strong> says when hrva.cc last looked.
              </p>
              <p>
                hrva.cc checks every minute for the first hour after approval, every 10 minutes until a day has
                passed, then every hour. After 14 days without the record it stops; see{" "}
                <a href="#problems">If it doesn&apos;t work</a>.
              </p>
              <p>
                A domain is <strong>{DOMAIN_STATUS_LABELS.DISABLED}</strong> when an admin turns it off for abuse,
                or on its own when the account is blocked or the domain is on a blocklist. The card shows the
                admin&apos;s note, or <Quote>{DISABLED_REASONS[0]}</Quote> or <Quote>{DISABLED_REASONS[1]}</Quote>{" "}
                Its links stop working until it&apos;s turned back on; visitors see a page saying{" "}
                <Quote>This link&apos;s domain is turned off right now.</Quote> <strong>{DOMAIN_STATUS_LABELS.REJECTED}</strong> and{" "}
                <strong>{DOMAIN_STATUS_LABELS.DELETED}</strong> domains leave the list after 30 days.
              </p>

              <h2 id="problems">If it doesn&apos;t work</h2>
              <p>
                When something needs you, the card says what in red. Below are the messages, why they happen and
                what to do.
              </p>
              <p>
                Once a domain needs attention, certificate, removed-record, CAA and Cloudflare problems are
                checked again every hour on their own. When hrva.cc has stopped looking for the DNS record, it waits for <strong>Check now</strong>,
                and a failed setup waits for <strong>Retry</strong> once its 24 hours of retries are over.
              </p>

              <Problem title="The record isn't found yet" problem="DNS_NOT_FOUND">
                <p>
                  This shows once 10 minutes have passed since approval. The record isn&apos;t there yet, has a
                  typo, or your provider hasn&apos;t published it. Check that it&apos;s a CNAME, and that the name
                  and the target match the card; copy them from it. On Cloudflare, check it&apos;s{" "}
                  <strong>DNS only</strong>. Then give it up to an hour.
                </p>
              </Problem>

              <Problem title="CAA records block the certificate" problem="CAA_BLOCKED">
                <p>
                  CAA records say which certificate authorities may issue certificates for your domain, and
                  yours leave out the one hrva.cc uses. Add a CAA record next to your other CAA records with
                  the value <code>0 issue &quot;pki.goog&quot;</code> (flags <code>0</code>, tag{" "}
                  <code>issue</code>, value <code>pki.goog</code>), or remove your CAA records.
                </p>
              </Problem>

              <Problem title="The certificate wasn't issued in time" problem="CERTIFICATE_TIMED_OUT">
                <p>
                  The record was missing or wrong while the certificate was being issued. A record that&apos;s
                  proxied on Cloudflare (orange cloud) does this too. Check the record as described above.
                </p>
              </Problem>

              <Problem title="The record was removed" problem="CNAME_REMOVED">
                <p>
                  The domain was working, and then the record went away or changed. Add the same record again;
                  the links work again once it&apos;s back.
                </p>
              </Problem>

              <Problem title="Cloudflare refused the domain" problem="CLOUDFLARE_BLOCKED">
                <p>
                  Cloudflare, which issues the certificates for custom domains, refused this domain. There&apos;s
                  nothing for you to change.
                </p>
              </Problem>

              <h3>Setup failed</h3>
              <p>
                The card says <Quote>{PROVISIONING_FAILED_TEXT}</Quote>
              </p>
              <p>
                Setting the domain up at Cloudflare failed. hrva.cc tries again after 1, 5 and 30 minutes, then
                every hour for 24 hours. Select <strong>Retry</strong> to try again now. If it still fails after 24
                hours, the card says <Quote>{PROVISIONING_GAVE_UP_TEXT}</Quote> and hrva.cc waits for you to select{" "}
                <strong>Retry</strong>.
              </p>

              <Problem title="hrva.cc stopped looking for the record" problem="DNS_TIMED_OUT">
                <p>
                  hrva.cc looked for the record for 14 days after approval and never found it. Once you&apos;ve
                  added it, <strong>Check now</strong> looks again.
                </p>
              </Problem>


              <h2 id="use-it">Make links on your domain</h2>
              <ol>
                <li>
                  Once the domain is <strong>{DOMAIN_STATUS_LABELS.ACTIVE}</strong>, select <strong>New URL</strong>{" "}
                  on your <Link href="/dashboard">URLs page</Link>, or use the form on the home page while signed
                  in.
                </li>
                <li>
                  In <strong>Domain</strong>, pick your domain. It starts on hrva.cc, and shows only once you have
                  an active domain.
                </li>
                <li>Shorten the link as usual. It opens at go.example.com and its alias.</li>
              </ol>
              <ul>
                <li>
                  Aliases are separate for each domain: go.example.com/menu and hrva.cc/menu can be two different
                  links, and hrva.cc/menu may belong to someone else.
                </li>
                <li>
                  A link&apos;s domain is set when you create it and can&apos;t be changed later.
                </li>
                <li>
                  Stats, visit limits, passwords, expiry, QR codes and the safety checks work the same as on
                  hrva.cc. A QR code opens your domain.
                </li>
                <li>
                  With the API, send your domain&apos;s name as <code>domain</code> when you create a link.
                </li>
                <li>
                  Only short links work on your domain. The root, go.example.com/, opens the hrva.cc home page,
                  and anything else on your domain, such as a bio page, answers <strong>Not found</strong>.
                </li>
              </ul>

              <h2 id="why-no-root">Why root domains aren&apos;t supported yet</h2>
              <p>
                A custom domain works through a CNAME record. A root domain like example.com can&apos;t have a
                CNAME record at most DNS providers, because it already holds other records, such as the ones for
                your email. Some providers get around this with CNAME flattening, but not all do, so for now
                hrva.cc takes subdomains only. A subdomain like go.example.com leaves your website and email as
                they are.
              </p>

              <h2 id="remove">Remove a domain</h2>
              <ol>
                <li>
                  In <Link href={SETTINGS_HREF}>Settings</Link>, under <strong>Custom domains</strong>, select{" "}
                  <strong>Remove</strong> next to the domain.
                </li>
                <li>
                  If it has links, choose under <strong>What happens to its links?</strong>:
                  <ul>
                    <li>
                      <strong>{LINK_MODE_LABELS.DEACTIVATE}</strong> (picked to start with):{" "}
                      {LINK_MODE_HINTS.DEACTIVATE}
                    </li>
                    <li>
                      <strong>{LINK_MODE_LABELS.MOVE}</strong>: {LINK_MODE_HINTS.MOVE}
                    </li>
                  </ul>
                </li>
                <li>
                  Select <strong>Remove domain</strong>. It says <strong>Removed go.example.com.</strong>, with how
                  many links were moved or turned off.
                </li>
              </ol>
              <p>
                Removing can&apos;t be undone, though you can <a href="#use-again">use the domain again</a>. The links stop working on your domain at once, whichever you
                choose, so printed QR codes and shared links that use your domain stop working too. Links you turn
                off can&apos;t be turned back on, because their domain is gone. Once it&apos;s removed, you can
                delete the CNAME record at your DNS provider.
              </p>
              <p>
                An admin can also remove a domain, with the same two choices, and you get an email when that
                happens.
              </p>

              <h2 id="use-again">Use a removed domain again</h2>
              <p>
                A domain you removed stays on the card for 30 days, in a closed section called{" "}
                <strong>Removed domains (n)</strong>, where n is how many there are. Open it and select{" "}
                <strong>{USE_AGAIN_LABEL}</strong> next to the domain. That adds the domain as a new one, with no links
                on it.
              </p>
              <p>
                It&apos;s set up again without a review when you removed the domain yourself after it was{" "}
                <strong>{DOMAIN_STATUS_LABELS.ACTIVE}</strong>. Two things can still send it to review: a check
                flags the domain, or there&apos;s no room for new domains right now. The card says{" "}
                <Quote>{USE_AGAIN_HINTS.SKIPS_REVIEW}</Quote>
              </p>
              <p>
                It goes back to review, as when you first applied, when:
              </p>
              <ul>
                <li>an admin removed it, or an admin or a blocklist rule turned it off before you removed it;</li>
                <li>it never became <strong>{DOMAIN_STATUS_LABELS.ACTIVE}</strong>;</li>
                <li>its name is international, with letters beyond a to z (an <code>xn--</code> name);</li>
                <li>an admin block rule matches its name;</li>
                <li>your account has been flagged as a possible scammer.</li>
              </ul>
              <p>
                In those cases the card says <Quote>{USE_AGAIN_HINTS.NEEDS_REVIEW}</Quote> After you select{" "}
                <strong>{USE_AGAIN_LABEL}</strong>, the domain shows as <strong>{DOMAIN_STATUS_LABELS.PENDING_REVIEW}</strong>.
              </p>
              <p>
                A name the link check blocks, such as one a blocklist source lists, isn&apos;t sent to review.{" "}
                <strong>{USE_AGAIN_LABEL}</strong> is refused with <Quote>This domain can&apos;t be used on hrva.cc.</Quote>
              </p>
              <p>
                <strong>{USE_AGAIN_LABEL}</strong> isn&apos;t offered in three cases:
              </p>
              <ul>
                <li>
                  Another domain, yours or someone else&apos;s, holds the name. After you use a domain again, the old
                  removed one stays in the list for up to 30 days with no button and no line under it.
                </li>
                <li>
                  The name no longer passes the rules for a domain name. The removed domain shows with no button and no
                  line under it.
                </li>
                <li>
                  Cloudflare is still removing the domain. The card says <Quote>{USE_AGAIN_PENDING_LINE}</Quote>{" "}
                  Check back in a few minutes.
                </li>
              </ul>
              <p>
                A domain you use again counts toward your domain limit like any other, so at the limit,{" "}
                <strong>{USE_AGAIN_LABEL}</strong> is refused until you remove or withdraw another domain. Removed
                domains don&apos;t count.
              </p>

              <h2 id="privacy">Custom domains and your privacy</h2>
              <ul>
                <li>
                  Visitors who open links on your domain get the same privacy as on hrva.cc: daily counts only, and
                  their IP addresses are never stored.
                </li>
                <li>
                  Cloudflare receives your domain&apos;s name, to issue and renew its certificate.
                </li>
                <li>
                  A request for more domains keeps how many you asked for, your reason, the admin&apos;s decision and
                  note, and its dates, until you delete your account.
                </li>
                <li>
                  Certificates are published in public Certificate Transparency logs, so your domain&apos;s name
                  becomes public once it&apos;s set up, even if you never share a link.
                </li>
              </ul>
              <p>
                The <Link href="/privacy#custom-domains">Privacy Policy</Link> says what hrva.cc stores about your
                domain and for how long.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Custom domains" path="/help/custom-domains" />
    </div>
  )
}
