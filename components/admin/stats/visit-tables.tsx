"use client"

import type { ReactNode } from "react"
import { RankedList } from "@/components/admin/stats/ranked-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SIGNUP_ANSWER_LABELS, SIGNUP_ANSWER_ORDER, type SignupSource } from "@/lib/signup-source"
import { visitKindLabels } from "@/lib/admin-stats"
import { useVisitStats } from "@/lib/hooks/useSiteStats"
import type { AnalyticsRange, CountEntry } from "@/lib/types"

export const VISITS_NOT_CONNECTED = "Visit counting isn't connected. Add the Cloudflare analytics token to the backend."

export const VISITS_LIMIT_NOTE = "Visit counts go back 90 days."

export const VISITS_FAILED = "Visit counts can't be read right now. Try again later."

interface CardProps {
  title: string
  aside?: ReactNode
  busy?: boolean
  children: ReactNode
}

function Card({ title, aside, busy, children }: CardProps) {
  return (
    <section
      className={cn("min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-opacity", busy && "opacity-60")}
      aria-busy={busy}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Message({ children }: { children: ReactNode }) {
  return <p role="status" className="px-5 py-8 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">{children}</p>
}

interface VisitsTableProps {
  name: string
  firstColumn: string
  rows: { key: string; value: string; kind?: string; visits: number }[]
}

function VisitsTable({ name, firstColumn, rows }: VisitsTableProps) {
  const showKind = rows.some((row) => row.kind != null)
  return (
    <Table aria-label={name}>
      <TableHeader>
        <TableRow>
          <TableHead>{firstColumn}</TableHead>
          {showKind && <TableHead>Kind</TableHead>}
          <TableHead className="text-right">Visits</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="min-w-0 [overflow-wrap:anywhere]">{row.value}</TableCell>
            {showKind && <TableCell className="min-w-24 break-words text-muted-foreground">{row.kind}</TableCell>}
            <TableCell className="text-right tabular-nums">{row.visits.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function VisitsLoading({ title }: { title: string }) {
  return (
    <Card title={title}>
      <div className="space-y-2 p-5" aria-busy="true">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </Card>
  )
}

interface VisitTablesProps {
  days: AnalyticsRange
}

export function VisitTables({ days }: VisitTablesProps) {
  const query = useVisitStats(days)
  const titles = ["Where visits come from", "Landing pages"]

  if (query.isPending) return <>{titles.map((title) => <VisitsLoading key={title} title={title} />)}</>

  if (query.isError) {
    return (
      <>
        {titles.map((title) => (
          <Card key={title} title={title}>
            <Message>{query.error.message || VISITS_FAILED}</Message>
            <div className="px-5 pb-6 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={query.isRefetching ? undefined : () => query.refetch()}
                aria-disabled={query.isRefetching}
                className="aria-disabled:opacity-50"
              >
                Retry
              </Button>
            </div>
          </Card>
        ))}
      </>
    )
  }

  const data = query.data
  const limited = data.connected && data.days < data.requestedDays
  const note = limited ? VISITS_LIMIT_NOTE : null
  const emptyText = data.connected ? "No visits counted in this period." : VISITS_NOT_CONNECTED
  const sources = data.sources ?? []
  const pages = data.pages ?? []
  const total = data.total ?? 0
  const refreshing = query.isPlaceholderData

  return (
    <>
      <Card
        title="Where visits come from"
        busy={refreshing}
        aside={data.connected ? `${total.toLocaleString()} ${total === 1 ? "visit" : "visits"}` : undefined}
      >
        {note && <p className="border-b px-5 py-2 text-xs text-muted-foreground">{note}</p>}
        {sources.length === 0 ? (
          <Message>{emptyText}</Message>
        ) : (
          <VisitsTable
            name="Where visits come from"
            firstColumn="Source"
            rows={sources.map((entry) => ({
              key: `${entry.kind}:${entry.source}`,
              value: entry.source,
              kind: visitKindLabels[entry.kind] ?? entry.kind,
              visits: entry.visits,
            }))}
          />
        )}
      </Card>
      <Card title="Landing pages" busy={refreshing}>
        {note && <p className="border-b px-5 py-2 text-xs text-muted-foreground">{note}</p>}
        {pages.length === 0 ? (
          <Message>{emptyText}</Message>
        ) : (
          <VisitsTable
            name="Landing pages"
            firstColumn="Page"
            rows={pages.map((entry) => ({ key: entry.page, value: entry.page, visits: entry.visits }))}
          />
        )}
      </Card>
    </>
  )
}

interface SignupSourcesProps {
  entries: CountEntry[] | undefined
}

export function SignupSources({ entries }: SignupSourcesProps) {
  if (!entries) return null
  const counts = new Map(entries.map((entry) => [entry.value, entry.count]))
  const rows: CountEntry[] = SIGNUP_ANSWER_ORDER.map((value) => ({ value, count: counts.get(value) ?? 0 }))
  return (
    <RankedList
      title="How accounts found hrva.cc"
      note="All answers so far, not limited to the selected period."
      valueLabel="Accounts"
      entries={rows}
      label={(value) => SIGNUP_ANSWER_LABELS[value as SignupSource] ?? value}
    />
  )
}
