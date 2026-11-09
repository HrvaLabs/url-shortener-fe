import type { CountEntry } from "@/lib/types"

interface RankedListProps {
  title: string
  valueLabel: string
  entries: CountEntry[]
  label?: (value: string) => string
  emptyText?: string
  note?: string
}

export function RankedList({ title, valueLabel, entries, label, emptyText, note }: RankedListProps) {
  const largest = Math.max(1, ...entries.map((entry) => entry.count))

  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-baseline justify-between gap-4 border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{valueLabel}</span>
      </div>
      {note ? <p className="border-b px-5 py-2 text-xs text-muted-foreground">{note}</p> : null}
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="space-y-1 p-3">
          {entries.map((entry) => {
            const text = label ? label(entry.value) : entry.value
            return (
              <li key={entry.value} className="relative flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 rounded-md bg-brand/10"
                  style={{ width: `${(entry.count / largest) * 100}%` }}
                />
                <span className="relative min-w-0 [overflow-wrap:anywhere]">{text}</span>
                <span className="relative shrink-0 tabular-nums text-muted-foreground">{entry.count.toLocaleString()}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
