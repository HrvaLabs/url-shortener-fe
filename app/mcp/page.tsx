import { Fragment } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { pageMetadata } from "@/lib/seo"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { CodeBlock, InlineCode } from "@/components/code-block"
import { CopyButton } from "@/components/copy-button"

const description =
  "Connect Claude, ChatGPT, Cursor or VS Code to the hrva.cc MCP server and let your AI assistant shorten links into your account."

export const metadata: Metadata = pageMetadata({ title: "MCP server", description, path: "/mcp" })

const accountUrl = "https://hrva.cc/mcp"

const claudeCodeCommand = `claude mcp add --transport http hrva ${accountUrl}`
const cursorConfig = JSON.stringify({ mcpServers: { hrva: { url: accountUrl } } }, null, 2)
const vsCodeConfig = JSON.stringify({ servers: { hrva: { type: "http", url: accountUrl } } }, null, 2)

const endpoints = [
  {
    name: "Your account",
    url: accountUrl,
    description: "You sign in with your hrva.cc account. Links go into it, and your assistant can list them and read their visits.",
  },
]

const toolGroups = [
  {
    name: "Your account",
    url: accountUrl,
    tools: [
      {
        name: "shorten_url",
        description: (
          <>
            Shortens a URL into your account, with an optional alias, visit limit, expiry and tags. Links it creates
            are tagged <InlineCode>ai</InlineCode>.
          </>
        ),
      },
      { name: "list_links", description: "Lists your links, newest first, with search and a tag filter." },
      {
        name: "link_stats",
        description:
          "Shows a link's clicks, daily unique visitors and bot clicks for the last 7, 30, 90 or 365 days, with its top referrers, countries and devices.",
      },
    ],
  },
]

const examplePrompts = [
  { prompt: "Shorten https://example.com/autumn-sale as autumn-sale, and make it stop working after 500 visits.", tool: "shorten_url" },
  { prompt: "Which of my links are tagged newsletter? Show the newest first.", tool: "list_links" },
  { prompt: "How many clicks did hrva.cc/autumn-sale get in the last 30 days, and where did they come from?", tool: "link_stats" },
]

export default function McpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Use hrva.cc from your AI assistant</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              Connect the hrva.cc MCP server, and your assistant can shorten links into your account, list them and
              check their visits.
            </p>

            <Section title="What it is">
              <Paragraph>
                MCP, the Model Context Protocol, is an open standard that lets an AI assistant use tools from other
                services. The hrva.cc MCP server gives yours three tools, all working in your own account: shorten a URL,
                list your links, and read a link&apos;s visit totals. You connect it once by signing in to hrva.cc, and you can disconnect it at any time. It is
                free. To shorten links from your own code instead, use the{" "}
                <Link href="/developers" className="text-brand-link">
                  API
                </Link>
                .
              </Paragraph>
            </Section>

            <Section title="Server URLs">
              <ul className="divide-y rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                {endpoints.map((endpoint) => (
                  <li key={endpoint.url} className="p-5">
                    <h3 className="text-sm font-semibold">{endpoint.name}</h3>
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
                      <code className="min-w-0 font-mono text-[13px] font-medium text-foreground [overflow-wrap:anywhere]">{endpoint.url}</code>
                      <CopyButton
                        text={endpoint.url}
                        label={`${endpoint.name.toLowerCase()} URL`}
                        className="text-muted-foreground hover:bg-accent hover:text-foreground"
                      />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{endpoint.description}</p>
                  </li>
                ))}
              </ul>
              <Paragraph className="mt-5">
                When you add the account URL, your app opens the hrva.cc sign-in page. Sign in as usual, with your
                password and two-factor code or with Google or GitHub, then allow the app on the consent screen at{" "}
                <InlineCode>app.hrva.cc/connect</InlineCode>. The screen shows where the app will send you once you
                allow it; the app chooses its own name, so check that address. When an app is connected for the first
                time, hrva.cc emails you.
              </Paragraph>
              <Paragraph className="mt-4">
                The server without an account is gone. If your AI app shows <InlineCode>hrva.cc/mcp/anon</InlineCode>{" "}
                as failing or not found, remove it and add <InlineCode>https://hrva.cc/mcp</InlineCode>. You&apos;ll be
                asked to sign in, or to create a free account.
              </Paragraph>
            </Section>

            <Section title="Set it up">
              <Paragraph>
                It works with MCP clients that support remote servers with OAuth. Here is how to add it to the common
                ones.
              </Paragraph>

              <Client title="Claude app (web, desktop, phone)">
                <Paragraph>
                  In Claude on the web or desktop, open <MenuPath>Customize → Connectors</MenuPath>, add a custom
                  connector and paste this URL. Once it is connected, it works in the Claude phone app too. On Team and
                  Enterprise plans, an owner adds it first under <MenuPath>Organization settings → Connectors</MenuPath>.
                </Paragraph>
                <CodeBlock label="Connector URL" code={accountUrl} copyLabel="Claude connector URL" />
              </Client>

              <Client title="Claude Code">
                <Paragraph>
                  Run this in a terminal, then run <InlineCode>/mcp</InlineCode> inside Claude Code to sign in.
                </Paragraph>
                <CodeBlock label="Terminal" code={claudeCodeCommand} copyLabel="Claude Code command" prompt />
              </Client>

              <Client title="Cursor">
                <Paragraph>
                  Add this to <InlineCode>~/.cursor/mcp.json</InlineCode> to use it in every project, or to{" "}
                  <InlineCode>.cursor/mcp.json</InlineCode> for one project. If the file already lists servers, add the{" "}
                  <InlineCode>hrva</InlineCode> entry next to them.
                </Paragraph>
                <CodeBlock label="~/.cursor/mcp.json" code={cursorConfig} copyLabel="Cursor configuration" mono />
              </Client>

              <Client title="VS Code">
                <Paragraph>
                  Run <MenuPath>MCP: Add Server</MenuPath> from the Command Palette, choose HTTP and paste the account
                  URL. Or add this to <InlineCode>.vscode/mcp.json</InlineCode> in your project.
                </Paragraph>
                <CodeBlock label=".vscode/mcp.json" code={vsCodeConfig} copyLabel="VS Code configuration" mono />
              </Client>

              <Client title="ChatGPT">
                <Paragraph>
                  In ChatGPT on the web, go to <MenuPath>Plugins</MenuPath>, select +, then{" "}
                  <MenuPath>Add custom MCP server</MenuPath>, and enter this URL. Whether you can add custom servers,
                  and use tools that create links, depends on your ChatGPT plan and workspace settings.
                </Paragraph>
                <CodeBlock label="Server URL" code={accountUrl} copyLabel="ChatGPT server URL" />
              </Client>
            </Section>

            <Section title="Tools">
              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sm:w-40">Tool</TableHead>
                      <TableHead>What it does</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolGroups.map((group) => (
                      <Fragment key={group.url}>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead colSpan={2} className="h-9 text-foreground">
                            {group.name}
                            <span className="ml-2 font-mono font-normal text-muted-foreground">{group.url}</span>
                          </TableHead>
                        </TableRow>
                        {group.tools.map((tool) => (
                          <TableRow key={tool.name}>
                            <TableCell className="whitespace-nowrap align-top font-mono text-[13px] font-medium">
                              {tool.name}
                            </TableCell>
                            <TableCell className="align-top leading-relaxed text-muted-foreground">
                              {tool.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>

            <Section title="Things to ask it">
              <ul className="space-y-3">
                {examplePrompts.map((example) => (
                  <li key={example.prompt} className="rounded-xl border bg-card p-4">
                    <p className="leading-7 text-foreground">&ldquo;{example.prompt}&rdquo;</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Uses <InlineCode>{example.tool}</InlineCode>
                    </p>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="What your assistant can see">
              <Paragraph>
                Only what the tools return from your account: your links, with their destinations, visits and status, and
                for one link at a time its clicks, daily unique visitors and bot clicks, with its top referrers, countries
                and devices. It can&apos;t see who clicked a link, because hrva.cc doesn&apos;t store visitors&apos; IP
                addresses or anything about a single click (
                <Link href="/privacy-first-url-shortener" className="text-brand-link">
                  how visits are counted
                </Link>
                ). What hrva.cc keeps about the connection itself is in the{" "}
                <Link href="/privacy" className="text-brand-link">
                  privacy policy
                </Link>
                , under AI connectors.
              </Paragraph>
            </Section>

            <Section title="What it can't do">
              <Paragraph>
                It can&apos;t edit, deactivate or delete links, and it can&apos;t change your account settings. Do those in
                your{" "}
                <Link href="/dashboard" className="text-brand-link">
                  dashboard
                </Link>
                .
              </Paragraph>
            </Section>

            <Section title="Disconnecting">
              <Paragraph>
                Open{" "}
                <Link href="/dashboard/settings" className="text-brand-link">
                  Settings → Connected apps
                </Link>{" "}
                and choose Disconnect next to the app. It will need to sign in again to use hrva.cc.
              </Paragraph>
            </Section>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="mb-4 font-display text-2xl leading-tight">{title}</h2>
      {children}
    </section>
  )
}

function Client({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h3 className="mb-2 font-display text-lg leading-snug">{title}</h3>
      {children}
    </div>
  )
}

function Paragraph({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("leading-7 text-foreground/80", className)}>{children}</p>
}

function MenuPath({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>
}
