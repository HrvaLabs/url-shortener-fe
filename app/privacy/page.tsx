import Link from "next/link"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { CONTENT_UPDATED, formatContentDate } from "@/lib/content-dates"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How hrva.cc handles your data: what we collect, why, how long we keep it, and your rights under the GDPR.",
  path: "/privacy",
})

const LAST_UPDATED = formatContentDate(CONTENT_UPDATED["/privacy"])

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-sm tabular-nums text-muted-foreground">Last updated: {LAST_UPDATED}</p>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: we collect only what the service needs to work. No ads, no tracking
                cookies, no analytics scripts. Link statistics are daily counts and never store
                visitors&apos; IP addresses. Visits to hrva.cc&apos;s own pages are counted by where
                the visitor came from, with no IP address and nothing stored on the device.
              </p>
            </div>

            <div className="prose-custom">
              <h2>Who we are</h2>
              <p>
                hrva.cc is a non-commercial hobby project of{" "}
                <a href="https://hrvalabs.net/" target="_blank" rel="noopener noreferrer">HrvaLabs</a>,
                operated by{" "}
                <a href="https://karlo.cc" target="_blank" rel="noopener noreferrer">Karlo Hrvačić</a>,
                who is the data controller within the meaning of
                Art. 4(7) of the General Data Protection Regulation (GDPR). The service is provided
                free of charge and as is — see the <Link href="/terms">Terms of Use</Link>. For
                anything related to your personal data, contact{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a>.
              </p>

              <h2>What we collect and why</h2>

              <h3 id="account-data">Account data</h3>
              <p>
                When you register, we process your email address, an optional display name, and your
                password, which is stored only as a salted one-way hash. If you sign in with Google,
                we receive your name and email address from that account instead of a password. If
                you sign in with GitHub, we receive your public profile (username and name) and the
                email addresses on the account instead of a password; hrva.cc uses only the verified
                primary one. Two-step verification is available whether you sign in with a password,
                Google or GitHub. If you turn it on, we store the shared secret of your authenticator
                app, if you use one, and one-way hashes of your recovery codes, so we can verify your
                codes. If you add a passkey or security key, we store its public key and a few
                details: the name you give it, when it was added and last used, which connection types
                it supports (such as USB or NFC), whether it&apos;s synced between your devices, and its
                model identifier when the device shares one. We also keep the technical data needed to
                check it when you sign in, such as its credential ID, a sign-in counter and the data
                your device sent when you added it. We also store a random identifier that
                links your passkeys to your account. Your fingerprint, face or PIN never leaves your
                device, and hrva.cc never receives it. When you add a passkey, we email you a security
                notice. We also record when your account was created, when you last logged in, and
                when its sessions were last ended (by Sign out everywhere, a password change or reset,
                or turning a sign-in method off), so older sign-in tokens stop working.
              </p>
              <p>
                Which ways you&apos;ve signed in (email and password, passkey, Google or GitHub), when
                you last used each, and any you turned off. Deleted with your account.
              </p>
              <p>
                Legal basis: performance of a contract (Art. 6(1)(b) GDPR) — this data is required to
                provide your account.
              </p>

              <h3 id="signup-question">The sign-up question</h3>
              <p>
                The dashboard may ask &quot;How did you find hrva.cc?&quot;
                You can pick one of a fixed list of answers (an AI assistant, a search engine, an
                hrva.cc link or bio page someone shared, someone recommended it, a website, list or
                directory, or something else) or skip. It is optional, and skipping changes nothing
                about your account. The answer, or the fact that you skipped, is stored with your
                account so the question is not asked again, and it is deleted with your account. The
                admin statistics show only how many accounts gave each answer.
              </p>
              <p>
                Legal basis: your consent (Art. 6(1)(a) GDPR). The answer is optional. To withdraw it,
                write to <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a> or delete your account.
              </p>

              <h3>Link statistics (visitors who open short links)</h3>
              <p>
                When someone opens a short link, hrva.cc adds to that link&apos;s counts for the day.
                For each link and day it keeps only totals: clicks, unique visitors, clicks from bots
                and link previews, and how many clicks came from each referring site&apos;s domain
                (for example t.co), each country, each device type (mobile, tablet or desktop), each
                browser and operating system family, and whether the click came from a QR code made by
                hrva.cc. The country comes from Cloudflare, which
                carries our traffic; we don&apos;t look up locations ourselves. Full addresses of
                referring pages, full browser identifiers and IP addresses are never stored, and
                nothing is recorded about an individual click. Short links set no cookies and run no
                scripts.
              </p>
              <p>
                To count unique visitors, the visitor&apos;s IP address and browser identifier are
                combined with the link and a random key that changes every day, and turned into a
                one-way hash. The hashes and the day&apos;s key are kept only in Redis, never in our
                database, and expire a few hours after the day ends. Without the key the hashes
                can&apos;t be traced back to anyone, and because the key changes every day and the
                link is part of the hash, the same visitor can&apos;t be followed across days or
                across links. Link owners see only the daily totals.
              </p>
              <p>
                Legal basis: legitimate interest (Art. 6(1)(f) GDPR) — providing link owners with
                basic, privacy-preserving usage statistics and protecting the service from abuse.
              </p>

              <h3 id="visit-counts">Visits to hrva.cc&apos;s own pages</h3>
              <p>
                When someone opens a page of hrva.cc itself, such as the home page, a help page or a
                blog post, the Worker that serves the site adds one data point to a dataset in
                Cloudflare Workers Analytics Engine. It holds four things: where the visitor came
                from, which is the host of the referring site (for example chatgpt.com), the value of
                the <em>utm_source</em> tag in the address when there is one, or &quot;direct&quot; when
                there is neither; which of those three it was (a <em>utm_source</em> tag, a referring
                site or neither); the page path without anything after a question mark; and the time.
                A <em>utm_source</em> value is kept only if it is made of lowercase letters, digits,
                dots and hyphens and is at most 64 characters, otherwise it is recorded as
                &quot;other&quot;. The point is to see which sites send visitors to hrva.cc.
              </p>
              <p>
                No IP address, device or browser identifier, country, cookie or anything in your
                browser is stored for this, and the counter adds no script to the page. It does not
                count short link clicks (those are the link statistics above), the dashboard and admin
                pages, the pages that finish a sign-in or an AI-app connection, pages opened from a link
                in an hrva.cc email (verifying your address, resetting a password, unsubscribing),
                password-protected link pages, or pages opened from another page of hrva.cc.
                Prefetches and requests Cloudflare marks as verified bots are skipped, and so is any
                answer other than a successful page, such as a redirect or a missing page. Cloudflare Workers Analytics Engine
                keeps these points for 3 months; hrva.cc does not keep them longer. See Cloudflare&apos;s{" "}
                <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
              </p>
              <p>
                Legal basis: legitimate interest (Art. 6(1)(f) GDPR) — seeing which sites send visitors
                to hrva.cc. Each point holds only the source, the kind of source, the page and the time, with nothing that identifies a visitor, and the admin sees only totals.
              </p>

              <h3>Bio pages</h3>
              <p>
                If you create a bio page, we store what you enter for it: your handle, display name,
                bio, avatar choice (initials or an emoji), colour and theme, and which of your short
                links appear as buttons, with their titles, icons, order and whether each is shown,
                your search-engine setting, and when the page was created and last changed. Everything
                on the page is public at hrva.cc/@yourhandle, so add only what you want anyone to see.
                Your email address is never shown on the page. Search engines are asked not to list the
                page unless you turn on &quot;Allow search engines to index this page&quot;.
              </p>
              <p>
                When someone opens a bio page, their browser tells hrva.cc once that the page was
                viewed. We count each visitor at most once a day with the same one-way hash as link
                statistics: the IP address and browser identifier are combined with the page and a key
                that changes every day, kept only in Redis and deleted a few hours after the day ends.
                We store only daily totals per page: views, and views by bots. The page sets no cookies
                and loads no third-party scripts, fonts or trackers. Clicks on its buttons are ordinary
                short link clicks, counted as described above.
              </p>
              <p>
                When you change your handle or delete your page, we keep the old handle for 30 days, so
                nobody can take it to pretend to be you, and then delete it. Like links, a bio
                page&apos;s text (handle, name, bio and button titles) is checked automatically for brand
                names and phishing words; a hit sends the page to an admin, and the notes, any visitor
                reports, and an admin&apos;s reason for hiding the page or taking back its handle are
                kept with the page and deleted with it. Admin actions on a page, such as hiding it or
                taking back its handle, are also recorded in the audit log (see{" "}
                <a href="#security-and-audit-logs">Security and audit logs</a>). A handle an admin takes
                back is also kept on the reserved list, with the admin&apos;s reason but without a link
                to you, until an admin releases it.
              </p>
              <p>
                Legal basis: performance of a contract (Art. 6(1)(b) GDPR) for the page you publish;
                legitimate interest (Art. 6(1)(f) GDPR) for the view counts, for keeping old handles,
                and for checking and reviewing pages to protect visitors and the service from abuse.
              </p>

              <h3>Storage in your browser</h3>
              <p>
                We keep a few small items in your browser, only so the site works the way you asked,
                and none of them leaves your browser except the sign-in token, which is sent to
                hrva.cc with your requests, and the sign-in check value below, which is sent to hrva.cc
                once to finish a Google or GitHub sign-in. The last item is Cloudflare&apos;s, not ours:
              </p>
              <ul>
                <li>
                  your sign-in token, in <em>localStorage</em>, so you stay signed in after you log in
                </li>
                <li>your light or dark theme choice, in <em>localStorage</em>, if you pick one</li>
                <li>
                  the last five campaign (UTM) tags you used for each field, in <em>localStorage</em>, so the link
                  form can suggest them again; <strong>Clear</strong> under the UTM fields, next to{" "}
                  <strong>Remembered on this device</strong>, removes them
                </li>
                <li>
                  the page to return to after you sign in with Google or GitHub, in{" "}
                  <em>sessionStorage</em>, removed once you are back
                </li>
                <li>
                  when you start a Google or GitHub sign-in, a random check value, in{" "}
                  <em>localStorage</em>, so only this browser can finish that sign-in; removed once you are back,
                  and no longer accepted after 10 minutes
                </li>
                <li>
                  after <em>Try again</em> on a bio page that couldn&apos;t load, that page&apos;s
                  handle, in <em>sessionStorage</em>, so keyboard focus can return to it; removed
                  straight away
                </li>
                <li>
                  a copy of the offline page, in the browser&apos;s cache storage, kept by hrva.cc&apos;s
                  service worker so the site can show it when you have no connection
                </li>
                <li>
                  <em>cf.turnstile.u</em>, in <em>localStorage</em>, set by Cloudflare&apos;s check frame
                  (challenges.cloudflare.com), not by hrva.cc, when you start making a link without an account
                  while the human check is on; see Cloudflare&apos;s <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Turnstile Privacy Addendum</a>. hrva.cc never reads it
                </li>
              </ul>
              <p>
                These are strictly necessary to provide the service you requested, which is why no
                consent banner is required for them (Art. 5(3) of the ePrivacy Directive, implemented
                in Croatia by the Electronic Communications Act). We set no tracking cookies and use
                no analytics or advertising scripts. Fonts are self-hosted — your browser does not
                contact third-party font services.
              </p>

              <h3>Emails we send</h3>
              <p>
                We send transactional emails: address verification, password reset, security
                notices (for example when a passkey is added to your account), and a notice when one of
                your links is blocked or your account is deactivated, and notices about your custom domain when
                it&apos;s approved, not approved, turned off or removed by an admin, and when your request for more custom
                domains is approved or not approved. We also send the notification emails
                you turn on, as described under <a href="#notifications">Notifications</a>. We keep a log of
                emails sent to operate and troubleshoot delivery; for a notification email, the log also
                notes which notification it was. We do not send marketing email.
              </p>

              <h3 id="notifications">Notifications</h3>
              <p>
                If you turn on a notification email (dead links, the weekly summary or expiry reminders),
                we record when you turned it on and off, and how (in Settings or with an unsubscribe link).
                We keep that record as proof of your choice until you delete your account. Every such email
                has a one-click unsubscribe link.
              </p>
              <p>
                If you add a channel (Discord, Slack, Telegram, ntfy or your own webhook), we store its
                name, its address or token, which we encrypt, and the events you picked. A webhook&apos;s
                signing secret and an ntfy access token are encrypted too; a Telegram chat ID is stored as
                it is. For each event you pick, we keep the same record of when you turned it on and off,
                with the channel&apos;s type and name, also after you delete the channel. We send it only
                what you picked: counts of clicks, your short links, their destination hosts and dates. We
                never send visitors&apos; IP addresses, browsers or referrers, or your email address. Each
                channel&apos;s provider receives what we send; its privacy policy is linked under{" "}
                <em>Who else receives data</em>. You choose them,
                and you can delete a channel at any time. We keep a record of each delivery for 30 days to
                retry failures and show you the last result.
              </p>
              <p>
                Legal basis: your consent (Art. 6(1)(a) GDPR) for notification emails and channels;
                legitimate interest (Art. 6(1)(f) GDPR) for keeping the record of your consent.
              </p>

              <h3 id="custom-domains">Custom domains</h3>
              <p>
                If you apply for a custom domain, we store the domain, what you told us you&apos;ll use it for,
                the findings of the automatic safety checks on the domain, the admin&apos;s decision and notes
                (including why it was turned off, if it is), and the domain&apos;s setup status, including the id
                Cloudflare gives it, Cloudflare&apos;s status for it and the last error Cloudflare reported. We also store its dates: when you
                applied, and when it was reviewed, became active, was turned off or was removed. When you apply,
                and every night while it&apos;s active, the domain goes through the same checks as a link&apos;s
                destination, as described under <em>Keeping links safe</em>. Once it&apos;s approved, we send the
                domain&apos;s name to Cloudflare, to get its certificate issued and renewed. Certificates are
                published in public Certificate Transparency logs, so the name of your domain becomes public once
                it&apos;s set up. We keep this while the domain exists. When you remove it, or it isn&apos;t approved,
                its record stays, marked removed or not approved, until you delete your account. Visitors who open links
                on your domain get exactly the same privacy as visitors to hrva.cc: see &ldquo;Link
                statistics&rdquo;.
              </p>
              <p>
                If you ask for more custom domains, we store how many you asked for, what you told us you need them
                for, your limit when you asked, the admin&apos;s decision and note, and the dates you asked and it was
                reviewed. We use it to review the request and to show you its status; an approval sets your new limit.
                A request you withdraw is deleted at once. We keep the others until you delete your account.
              </p>
              <p>
                Legal basis: performing the service you asked for (Art. 6(1)(b) GDPR).
              </p>

              <h3 id="destination-history">Link destination changes</h3>
              <p>
                When the destination of one of your links changes, we record the old and the new
                destination, when it changed, the email address of the account that made the change,
                whether it was made signed in or with an API key, and whether an admin saved it although
                the link checks would have refused it. Admins can see this history, to look into a link
                whose destination changed. It is kept while the link exists and deleted with it.
              </p>
              <p>
                We also keep, with your account, when one of your links was last blocked and whether an
                admin set changing where your links point to always allowed or never allowed for your
                account. Both decide whether your links&apos; destinations can change (see{" "}
                <a href="/help/links#destination">Changing where a link points</a>), and are deleted with
                your account. Legal basis for this section: legitimate interest (Art. 6(1)(f) GDPR).
              </p>

              <h3 id="security-and-audit-logs">Security and audit logs</h3>
              <p>
                We keep an audit log of administrative actions, of changes you make to your links
                (editing them, changing where they point, turning them off or back on and deleting
                them) and of changes to sign-in methods (turning Google or GitHub sign-in off or back
                on, and removing a password) to protect the service and its users. Sign-ins are not in it: your account records when you last
                signed in and when each passkey or sign-in method was last used (see{" "}
                <a href="#account-data">Account data</a>), and failed sign-in attempts are kept only as
                short-lived counters (see <a href="#retention">How long we keep data</a>). Legal basis:
                legitimate interest (Art. 6(1)(f) GDPR).
              </p>

              <h3>AI connectors</h3>
              <p>
                If you connect an AI app to your account through the hrva.cc MCP server, we store the
                app&apos;s registration and your authorization of it (token records) in the hrva.cc
                database until you disconnect the app in Settings → Connected apps or it goes
                unused for 30 days. We don&apos;t store the URLs and messages the app sends us
                beyond the links it creates.
              </p>
              <p>
                To limit abuse, new AI app registrations are rate-limited per network. For this we
                keep a hash of your IP address (for IPv6, of its network prefix) in our cache for at
                most an hour. The plain IP address is not stored.
              </p>
              <p>
                Legal basis: performance of a contract (Art. 6(1)(b) GDPR) — this is required to
                provide the connection you requested.
              </p>

              <h2>Keeping links safe</h2>
              <p>
                To protect visitors from phishing, malware and scams, we check where links lead when
                they are created or changed, and again later.
              </p>
              <ul>
                <li>
                  <strong>Blocklists</strong> — destinations are checked against public blocklists of
                  harmful domains and links. We download these lists and store them on hrva.cc&apos;s
                  own server, so this check sends nothing to anyone.
                </li>
                <li>
                  <strong>Domain age</strong> — to learn when a destination&apos;s domain was
                  registered, we send the domain name to the domain registries (RDAP). Only the
                  domain name is sent.
                </li>
                <li>
                  <strong>Spamhaus</strong> — when this check is enabled, the domain name may be
                  looked up in Spamhaus&apos;s domain blocklist through DNS. Only the domain name is
                  sent.
                </li>
                <li>
                  <strong>Google Safe Browsing</strong> — receives the destination URL, as described
                  under <em>Who else receives data</em>.
                </li>
                <li>
                  <strong>Redirects</strong> — the hrva.cc server may request a destination to follow
                  its redirects and check where they lead. The destination&apos;s server sees a request
                  from hrva.cc, never from the visitor, and no visitor data is sent.
                </li>
                <li>
                  <strong>Destination page</strong> — for some links made without an account (those that
                  open the warning page), and for links made, repointed or turned back on from an account, the
                  hrva.cc server opens the destination page once after the link is saved, to see whether it
                  asks for sign-in or card details. The destination&apos;s server
                  sees a request from hrva.cc, not from the visitor, and no visitor data is sent. hrva.cc keeps
                  only which kind of field it found, not the page.
                </li>
                <li>
                  <strong>Screenshot</strong> — when a link is flagged for review, or when an admin asks for a
                  screenshot of it, Cloudflare receives its destination URL and opens it to take the screenshot,
                  as described under <em>Who else receives data</em>. No visitor data is sent. hrva.cc keeps each
                  screenshot for 7 days and deletes it in the next nightly cleanup.
                </li>
                <li>
                  <strong>VirusTotal</strong> — when a link is flagged for review, or when an admin asks for a
                  lookup, hrva.cc sends VirusTotal a fingerprint (a SHA-256 hash) of its destination address, to
                  find a report VirusTotal already has. The address itself isn&apos;t sent. An admin may choose to send a link&apos;s address to
                  VirusTotal to be scanned; VirusTotal then shows it to its paying users. See{" "}
                  <em>Who else receives data</em>.
                </li>
              </ul>
              <p>
                Links that lead to known or very likely harmful sites are refused or disabled
                automatically. Automated checks can also flag a link for review, or mark an account
                as a possible scammer. The admin reviews flagged links and decides what happens to
                them, and the checks never block an account on their own.
              </p>
              <p>
                A weekly summary of site-wide totals, and an alert when many new links to the same new
                domain appear in a short time, go only to the admin and never identify a visitor. For
                links made without an account, the check behind that alert keeps a one-way hash of the
                creator&apos;s network, together with the link, for one to two hours, to spot phishing
                waves.
              </p>
              <p>
                The admin can also moderate through the hrva.cc MCP connector in an AI app. The
                connector only receives masked user data, such as a partly hidden email address, and
                never IP addresses or visit details.
              </p>
              <p>
                If you <Link href="/report">report a link or bio page</Link>, we store the link or handle, the
                category and the details you write, and nothing about you beyond a rate-limit
                counter for your network, which expires after an hour. Reports are also posted to
                the admin&apos;s Discord channel, as described under <em>Who else receives data</em>.
              </p>
              <p>
                The <Link href="/stats">hrva.cc in numbers</Link> page shows only site-wide totals.
                Opening it stores nothing about you beyond a rate-limit counter for your network,
                which expires after an hour.
              </p>
              <p>
                Legal basis: legitimate interest (Art. 6(1)(f) GDPR) — protecting visitors and the
                service from abuse.
              </p>

              <h3 id="link-checker">Checking destinations</h3>
              <p>
                At most once a night, hrva.cc&apos;s server (Oracle Cloud, Frankfurt) asks each active short
                link&apos;s destination whether it still exists, with a HEAD request or a small GET,
                identified as <code>hrva.cc-linkcheck/1.0</code>. It follows up to 5 redirects. It sends no
                cookies and no visitor data, and it doesn&apos;t count as a click. The result (when the
                destination was checked, how many nights it has failed, since when it looks dead, and a
                short status such as &ldquo;404&rdquo;) is stored with the link. The link&apos;s owner sees
                when its destination looks dead; for links made without an account, only the admin does.
              </p>
              <p>
                Legal basis: legitimate interest (Art. 6(1)(f) GDPR) &mdash; keeping short links working and
                showing their owners when a destination is gone.
              </p>

              <h2>Who else receives data</h2>
              <ul>
                <li>
                  <strong>Google Sign-In</strong> — only if you choose to log in with Google. See
                  Google&apos;s <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </li>
                <li>
                  <strong>GitHub</strong> — only if you choose to log in with GitHub. See
                  GitHub&apos;s <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">General Privacy Statement</a>.
                </li>
                <li>
                  <strong>Google Safe Browsing</strong> — destination URLs you shorten, and the
                  addresses they redirect to, are checked against Google&apos;s threat database to
                  protect visitors from malicious sites, and so is the address of a custom domain you apply
                  for. Only the URL is sent, never information
                  about you or your visitors. See Google&apos;s <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </li>
                <li>
                  <strong>VirusTotal</strong> — when a link is flagged for review, or when an admin asks for a
                  lookup, it receives a SHA-256 hash of the link&apos;s destination address, so hrva.cc can find a report VirusTotal already has;
                  the address itself isn&apos;t sent. If an admin chooses to send a link to VirusTotal to be
                  scanned, VirusTotal receives its destination address and shows it to its paying users. No
                  visitor data is sent. See VirusTotal&apos;s <a href="https://docs.virustotal.com/docs/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="https://docs.virustotal.com/docs/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Notice</a>.
                </li>
                <li>
                  <strong>Domain registries and Spamhaus</strong> — receive only the domain name of a
                  destination, or of a custom domain you apply for, as described under{" "}
                  <em>Keeping links safe</em>. For
                  Spamhaus, see its <a href="https://www.spamhaus.org/privacy-notice/" target="_blank" rel="noopener noreferrer">Privacy Notice</a>.
                  When the admin reports domains used for abuse to their registrar, he sends the email from
                  his own mail app. It contains the domains, up to 3 destination addresses and the total
                  clicks and top countries of those links, never anything about a visitor.
                </li>
                <li>
                  <strong>Cloudflare</strong> — delivers the web application and short links
                  (hosting/CDN). Your IP address reaches Cloudflare as part of normal traffic
                  delivery, and Cloudflare tells us which country it belongs to, which we keep only
                  as a daily count. Cloudflare also receives the names of custom domains, to issue their
                  certificates. For hosting and certificates, see Cloudflare&apos;s <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                  Making a link without an account runs a Cloudflare Turnstile check; how
                  Cloudflare handles that data is in its <a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Turnstile Privacy Addendum</a>. hrva.cc stores nothing from it.
                  When a link is flagged for review, or when an admin asks for a screenshot of it, Cloudflare Browser Run
                  receives its destination URL and opens it to take the screenshot. hrva.cc keeps each screenshot for 7
                  days and deletes it in the next nightly cleanup. No visitor data is sent. See
                  Cloudflare&apos;s <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                  The counts of visits to hrva.cc&apos;s own pages (see{" "}
                  <a href="#visit-counts">Visits to hrva.cc&apos;s own pages</a>) are stored in Cloudflare
                  Workers Analytics Engine. Cloudflare&apos;s own terms apply there: its Privacy Policy, linked above, and
                  its <a href="https://www.cloudflare.com/terms/" target="_blank" rel="noopener noreferrer">Self-Serve Subscription Agreement</a>.
                </li>
                <li>
                  <strong>Discord</strong> — so the admin sees moderation events quickly, hrva.cc
                  posts alerts to a private Discord channel that only the admin reads: when a link
                  is flagged for review, reported by a visitor or blocked automatically, when a bio
                  page is sent for review by the automatic text checks or reported by a visitor, when
                  someone signs up, when a blocklist fails to load or loads again, and when many new
                  links to the same new domain appear in a short time (a possible phishing wave). An
                  alert can include the short link, the domain it points to (never the full
                  address), the owner&apos;s account number (not their email address or name), the
                  reasons for the flag or block, and for a visitor report its category and the full
                  details, with anything that looks like an email or IP address removed. A bio page
                  alert names the page&apos;s handle (or its page number if it has none) and the
                  owner&apos;s account number, and adds the reasons the text checks found or, for a
                  visitor report, its category and the full details, cleaned the same way. The
                  page&apos;s display name and bio text are never sent. A sign-up alert shows only the
                  account number and whether the account uses email, Google or GitHub. A phishing-wave
                  alert names the domain and its age, if known, and counts
                  the new links and the different accounts or networks that made them, without
                  saying which ones. The channel also gets an alert when links made without an
                  account share one URL shape across several domains (a possible campaign), naming
                  the path and the names of its query parameters, how many links and domains share
                  it and up to 3 short links; when one such link gets many clicks in a day, with the
                  short link, the domain it points to, the day&apos;s clicks and the country most came
                  from; when such links take most of the day&apos;s clicks, with the two totals; and when an admin
                  changes a setting, naming the setting and the admin&apos;s email address.
                  It also gets a line when a reported domain is suspended, naming the domain.
                  Every Monday the channel also gets the weekly summary:
                  site-wide totals for the past week, such as clicks, visitors, new links and users,
                  reviews and automatic blocks, how many reviews are still open, and the top 5 links
                  by clicks, each with its short link, the domain it points to and its click count.
                  Nothing in a message is cut short: when more alerts come in at once than fit in
                  one message, the rest aren&apos;t posted and the message ends with how many were
                  left out (&ldquo;and N more&rdquo;). When someone applies for a custom domain, the alert names
                  the domain, the account number and what the automatic checks found; when someone asks for more
                  custom domains, it names the account number, how many it asked for and its limit, never the reason; when a custom domain is
                  turned off, needs the admin&apos;s attention or is missing from Cloudflare, it names the domain
                  and the reason. Discord Inc. is based in the United States; see its <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                  The messages stay in the channel until the admin deletes them.
                </li>
                <li>
                  <strong>The notification channels you add</strong> &mdash; only if you add one: Discord,
                  Slack, Telegram, ntfy, or the address of your own webhook. hrva.cc sends each one the
                  notifications you picked for it: counts of clicks, your short links, their destination
                  hosts and dates. You choose these recipients; they aren&apos;t our processors. See the privacy policies of{" "}
                  <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">Discord</a>, <a href="https://slack.com/trust/privacy/privacy-policy" target="_blank" rel="noopener noreferrer">Slack</a>,
                  <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer">Telegram</a> and <a href="https://docs.ntfy.sh/privacy/" target="_blank" rel="noopener noreferrer">ntfy</a>. You can delete a channel at any time.
                </li>
                <li>
                  <strong>SendPulse</strong> — the email delivery service we use to send
                  transactional emails (verification, password reset, notifications and security
                  notices). It receives your email address and the content of those emails; see its <a href="https://sendpulse.com/legal/pp" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </li>
                <li>
                  <strong>Oracle Cloud Infrastructure</strong> — hosts the API, its database and its
                  cache in Frankfurt, Germany (EU). Traffic to them goes through Cloudflare. See Oracle&apos;s <a href="https://www.oracle.com/legal/privacy/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </li>
              </ul>
              <p>
                We do not sell personal data and we do not share it with anyone beyond the
                processors listed above and the notification channels you choose.
              </p>
              <p>
                Separately, if you connect an AI app to your account, that app receives the results
                of the tools it uses (short links, link lists and visit stats). It is not our
                processor; it handles that data under its own terms.
              </p>
              <h3 id="donations">Donations</h3>
              <p>
                The Revolut and PayPal buttons under Support hrva.cc on the <Link href="/about#support">About page</Link> are
                hrva.cc short links. Opening one is counted like any other short link visit (see
                Link statistics above), then your browser goes to Revolut or PayPal.
                hrva.cc sends them nothing beyond that redirect, and it receives nothing about a
                donation. Each company&apos;s own terms apply there: the <a href="https://www.revolut.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Revolut Privacy Policy</a> and
                the <a href="https://www.paypal.com/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer">PayPal Privacy Statement</a>.
              </p>

              <h2 id="retention">How long we keep data</h2>
              <ul>
                <li>
                  <strong>Counts of visits to hrva.cc&apos;s own pages</strong> — kept by Cloudflare
                  Workers Analytics Engine for 3 months.
                </li>
                <li>
                  <strong>Your answer to &quot;How did you find hrva.cc?&quot;</strong> — kept with your
                  account and deleted with it.
                </li>
                <li>
                  <strong>Unique-visitor hashes and the daily key</strong> — kept only in Redis and
                  deleted a few hours after the day ends.
                </li>
                <li>
                  <strong>Rate-limit counters</strong> — hold a hashed IP address and expire within
                  an hour. Sign-in counters also count per account under a hash of the email address
                  and expire within 15 minutes; counters of wrong two-step codes or wrong passwords
                  when confirming a change hold the account number and expire within a day. Requests for
                  password reset and verification emails are counted per network and per email address,
                  each under a hash, for an hour.
                </li>
                <li>
                  <strong>Account data</strong> — kept until you delete your account; unused
                  accounts are deactivated automatically after a period of inactivity.
                </li>
                <li>
                  <strong>Passkeys</strong> — until you remove them or delete your account.
                </li>
                <li>
                  <strong>Password reset tokens</strong> — deleted as soon as they expire.
                </li>
                <li>
                  <strong>Your links and their statistics</strong> — kept while your account exists;
                  deleting a link also deletes its daily counts.
                </li>
                <li>
                  <strong>Bio pages</strong> — kept until you delete the page or your account; their
                  daily view counts, review notes, visitor reports and an admin&apos;s reasons go with
                  them. The audit log&apos;s record of admin actions on the page is kept as listed for
                  the audit log below. An old handle is kept for 30 days after a change or deletion. A
                  handle an admin takes back is also kept on the reserved list, with the admin&apos;s
                  reason but without a link to you, until an admin releases it.
                </li>
                <li>
                  <strong>Connected-app token records</strong>{" "}
                  — deleted when you disconnect the app in Settings → Connected apps, or automatically
                  once the app&apos;s refresh token has gone unused for 30 days.
                </li>
                <li>
                  <strong>Email logs</strong> — kept for 90 days, then deleted automatically.
                </li>
                <li>
                  <strong>Notification consent records</strong> &mdash; when you turned each notification
                  email or channel event on and off, and how; kept until you delete your account, also after
                  you delete a channel.
                </li>
                <li>
                  <strong>Notification channels</strong> &mdash; kept until you delete the channel or your
                  account.
                </li>
                <li>
                  <strong>Channel deliveries</strong> &mdash; kept for 30 days, then deleted automatically.
                </li>
                <li>
                  <strong>Weekly summary markers</strong> &mdash; a note that a week&apos;s summary email was
                  sent, so it&apos;s never sent twice; kept for 60 days.
                </li>
                <li>
                  <strong>Custom domains</strong> &mdash; kept while the domain exists. When you remove it, or
                  it isn&apos;t approved, its record stays, marked removed or not approved, until you delete
                  your account. Everything about your custom domains is deleted when you delete your account.
                </li>
                <li>
                  <strong>Requests for more custom domains</strong> &mdash; kept until you delete your account; a
                  request you withdraw while it waits is deleted at once.
                </li>
                <li>
                  <strong>Link destination history</strong> &mdash; kept while the link exists, and deleted with it.
                </li>
                <li>
                  <strong>Audit log</strong> (admin actions, changes to your links and sign-in method changes) — kept for 12 months, then deleted automatically.
                </li>
              </ul>

              <h2>Your rights</h2>
              <p>
                Under the GDPR you can request access to, correction of, or deletion of your
                personal data, ask us to restrict or object to processing, and receive your data in
                a portable format (Arts. 15–21 GDPR). Write to{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a> and we will respond
                within one month. You can also download a copy of your data yourself in Settings → Your
                data; the export includes your passkeys&apos; names, types, sync state and dates, never key
                material.
                It also includes your bio page and its buttons.
                It also includes your notification consent history and your channels, with masked
                addresses and the Telegram chat ID, never their tokens or secrets.
                It also includes your custom domains, with their status, reason, the admin&apos;s note and
                dates, never their Cloudflare ids, internal errors or review flags.
                You also have the right to lodge a complaint with the Croatian
                Personal Data Protection Agency (
                <a href="https://azop.hr" target="_blank" rel="noopener noreferrer">AZOP</a>) or
                your local supervisory authority.
              </p>

              <h2>Changes to this policy</h2>
              <p>
                If we change how we process personal data, we will update this page and the date at
                the top. Substantial changes affecting registered users will also be announced by
                email or in the app.
              </p>

              <h2>Contact</h2>
              <p>
                Questions about privacy at hrva.cc:{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a>.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
