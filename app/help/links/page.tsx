import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description = "How random aliases, choosing your own alias, editing links, turning them back on, changing where they point, links being checked, visit limits, query strings and API keys work on hrva.cc."

export const metadata: Metadata = pageMetadata({ title: "Short links and API keys", description, path: "/help/links" })

export default function LinksHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Short links and API keys</h1>

            <div className="prose-custom">
              <h2 id="aliases">Random aliases</h2>
              <p>
                When you don&apos;t choose an alias, hrva.cc picks one from letters and digits without 0, O, 1, l and
                I, so it&apos;s easier to read out and type. Aliases are case-sensitive: hrva.cc/Ab3 and hrva.cc/ab3 are
                different links. A new random alias never differs from an existing one only by case. Links made before this
                rule keep their aliases.
              </p>

              <h2 id="custom-aliases">Choosing your own alias</h2>
              <p>
                With a free account you can set the alias yourself when you create a link, so it opens at, for example,
                hrva.cc/menu. The create form has an alias field; leave it empty to get a random one.
              </p>
              <ul>
                <li>An alias has 1 to 32 letters, numbers, hyphens or underscores.</li>
                <li>
                  Capital letters don&apos;t make a new name: once hrva.cc/menu exists, Menu and MENU are taken too. Opening a
                  link still needs the exact letters, so share it as you created it.
                </li>
                <li>
                  A name that contains a brand name is refused, and some names are reserved for the site itself. Try another
                  name; the refusal says which of the rules it was.
                </li>
                <li>
                  A name that looks like one of hrva.cc&apos;s own pages, such as support or admin, can&apos;t be used. The
                  refusal says &ldquo;This name looks like one of hrva.cc&apos;s own pages, so it can&apos;t be used. Try another.&rdquo;
                </li>
                <li>A name that someone already uses is taken. Try another.</li>
              </ul>
              <p>
                Custom aliases can be turned off by the site, and then the refusal says so. To see whether a name is free
                before you sign up, use the <Link href="/custom-short-links">name checker</Link>. It tells you only
                whether the name is free at that moment and does not hold it. Questions: <a href="mailto:support@hrva.cc">support@hrva.cc</a>.
              </p>

              <h2 id="edit">Editing a link</h2>
              <p>
                In <Link href="/dashboard">My URLs</Link>, <strong>Edit link</strong> (the pencil on each link) opens the
                link&apos;s form. You can change its visit limit, its expiry date, its password (set, change or{" "}
                <strong>Remove password</strong>), its tags and, when allowed, where it points. Leave the visit limit or
                the expiry date empty for none. A visit limit at or below the clicks already used turns the link off, and
                an expiry date in the past is refused. The short link, its stats and its QR codes stay the same.
              </p>

              <h2 id="turn-back-on">Turning a link back on</h2>
              <p>
                An expired link or one that used all its clicks opens in the same form. Give it a later expiry date or
                none, or a higher visit limit or none, and tick <strong>Turn this link back on when I save</strong>. Turning
                a link back on runs the same checks as a new link, so a destination they would refuse today keeps the
                link off. A blocked link can&apos;t be turned back on. Neither can a link that is{" "}
                <a href="#being-checked">being checked</a>; its form says it comes back on its own if it looks fine.
              </p>

              <h2 id="destination">Changing where a link points</h2>
              <p>
                A new destination gets the same checks as a new link and is refused or checked by an admin just like
                one. Each link&apos;s destination can change 5 times a day. Every change is recorded with the old and new
                destination, when it was made and by which account, and admins can see it.
              </p>
              <p>On hrva.cc links, your account needs to be in good standing:</p>
              <ul>
                <li>two-step sign-in is on (see <Link href="/help/passkeys#two-step">two-step sign-in</Link>);</li>
                <li>the account is at least 30 days old;</li>
                <li>its email is verified, or it signs in with Google or GitHub;</li>
                <li>none of its links is blocked or being checked, and none was blocked in the last 90 days.</li>
              </ul>
              <p>
                Links on your own <Link href="/help/custom-domains">custom domain</Link> can change without these, while
                the domain is active and the link isn&apos;t blocked or being checked. Links made without an account
                can&apos;t change where they point. An admin can turn destination changes off for an account or for
                everyone. When the destination can&apos;t change, the form shows it read-only with the exact list of
                what is missing under <strong>Why the destination can&apos;t change</strong>; the rest of the link can
                still be edited. API keys follow the same rules (see the{" "}
                <Link href="/developers#edit">API quickstart</Link>).
              </p>

              <h2 id="being-checked">Links that are being checked</h2>
              <p>
                When you make a link, change where it points or turn it back on, hrva.cc&apos;s server opens the
                destination page once, unless hrva.cc already trusts the destination&apos;s domain. If the page asks
                for a password, a username or ID number, or a card number, an admin checks the link, and the link can
                be put on hold until then. A sign-in page on one of the most-visited sites, such as Google&apos;s or
                Microsoft&apos;s own sign-in after a link to a private document, doesn&apos;t count. If the page
                can&apos;t be read, the link stays as it is. The destination&apos;s server sees a request from
                hrva.cc, not from you or your visitors.
              </p>
              <p>
                A link on hold shows <strong>Being checked</strong> in <Link href="/dashboard">My URLs</Link>, visitors
                are told that it is being checked, and its button on your <Link href="/help/link-in-bio">bio page</Link>{" "}
                is hidden. Until the check is done, you can&apos;t turn it back on or change where it points, and
                neither can an API key. If it looks fine, it comes back on by itself. If the admin blocks it, you get
                the email about a blocked link. Nothing is emailed when a link is put on hold.
              </p>

              <h2 id="visit-limits">Visit limits</h2>
              <p>
                A visit limit counts every click on the link, repeat clicks from the same person included. Bots and
                link previews don&apos;t count, and neither do HEAD requests from link checkers. Each click is counted
                before the visitor is sent on, so clicks at the same moment can&apos;t go past the limit. Once the limit
                is reached, the link stops working and says so. To use it again, edit it to raise or remove its visit
                limit and turn it back on in the same save (see{" "}
                <a href="#turn-back-on">Turning a link back on</a>).
              </p>
              <p>
                Your dashboard shows how many clicks have counted, for example &quot;3 of 5 clicks used&quot;. The
                Visits number counts unique visitors per day, so it can be lower than the clicks used.
              </p>

              <h2 id="query-strings">Query strings</h2>
              <p>
                A short link passes its query string on to the destination. hrva.cc/abc?ref=mail opens the
                destination with ref=mail added after the destination&apos;s own parameters, and before its #fragment,
                which stays. When both have a parameter with the same name, the destination&apos;s value is used.
                hrva.cc&apos;s own qr marker, which its QR codes add, isn&apos;t passed on. Only the query is added: the
                site the link opens never changes. A link with a password opens its destination as saved.
              </p>
              <p>
                A link made without an account passes nothing on: it always opens its destination as it was checked.
                When a value passed on is a web address that hrva.cc would block, nothing is passed on and the
                destination opens as saved.
              </p>

              <h2 id="api-keys">API keys</h2>
              <p>
                Revoking an API key is final. A revoked or expired key can&apos;t be turned back on or given a new
                expiry; it can only be deleted. Make a new key on your{" "}
                <Link href="/dashboard/api-keys">API keys</Link> page instead. The{" "}
                <Link href="/developers">API quickstart</Link> shows how to use one.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Short links and API keys" path="/help/links" />
    </div>
  )
}
