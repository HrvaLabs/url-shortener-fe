"use client"

import type { ReactNode } from "react"
import { RankedList } from "@/components/admin/stats/ranked-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  children: ReactNode
}

function Card({ title, aside, children }: CardProps) {
  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Message({ children }: { children: ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">{children}</p>
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
            {showKind && <TableCell className="text-muted-foreground [overflow-wrap:anywhere]">{row.kind}</TableCell>}
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
          </Card>
        ))}
      </>
    )
  }

  const data = query.data
  const limited = data.connected && data.days < data.requestedDays
  const note = limited ? VISITS_LIMIT_NOTE : null
  const emptyText = data.connected ? "No visits counted in this period." : VISITS_NOT_CONNECTED

  return (
    <>
      <Card title="Where visits come from" aside={`${data.total.toLocaleString()} ${data.total === 1 ? "visit" : "visits"}`}>
        {note && <p className="border-b px-5 py-2 text-xs text-muted-foreground">{note}</p>}
        {data.sources.length === 0 ? (
          <Message>{emptyText}</Message>
        ) : (
          <VisitsTable
            name="Where visits come from"
            firstColumn="Source"
            rows={data.sources.map((entry) => ({
              key: `${entry.kind}:${entry.source}`,
              value: entry.source,
              kind: visitKindLabels[entry.kind] ?? entry.kind,
              visits: entry.visits,
            }))}
          />
        )}
      </Card>
      <Card title="Landing pages">
        {note && <p className="border-b px-5 py-2 text-xs text-muted-foreground">{note}</p>}
        {data.pages.length === 0 ? (
          <Message>{emptyText}</Message>
        ) : (
          <VisitsTable
            name="Landing pages"
            firstColumn="Page"
            rows={data.pages.map((entry) => ({ key: entry.page, value: entry.page, visits: entry.visits }))}
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
  const counts = new Map((entries ?? []).map((entry) => [entry.value, entry.count]))
  const rows: CountEntry[] = SIGNUP_ANSWER_ORDER.map((value) => ({ value, count: counts.get(value) ?? 0 }))
  return (
    <RankedList
      title="How new accounts found hrva.cc"
      valueLabel="Accounts"
      entries={rows}
      label={(value) => SIGNUP_ANSWER_LABELS[value as SignupSource] ?? value}
      emptyText="No answers yet."
    />
  )
}
