import { useLayoutEffect, useRef } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { selectChevronClass } from "@/components/ui/select-chevron"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export const adminFieldClass =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"


export const adminSelectClass = `${adminFieldClass} ${selectChevronClass}`

type SortDirection = "asc" | "desc"

interface SortHeadProps {
  field: string
  label: string
  sortDir(field: string): string | null
  toggleSort(field: string, firstDirection?: SortDirection): void
  /** The order of the first click on this column; ascending unless given (`"desc"` for counts, so the largest come first). */
  firstDirection?: SortDirection
  className?: string
}

let refocusAfterReload: { field: string; path: string } | null = null

export function SortHead({ field, label, sortDir, toggleSort, firstDirection, className }: SortHeadProps) {
  const direction = sortDir(field)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const button = buttonRef.current
    if (refocusAfterReload?.field === field && refocusAfterReload.path === window.location.pathname) {
      refocusAfterReload = null
      if (document.activeElement === document.body) button?.focus()
    }
    return () => {
      if (button && document.activeElement === button) refocusAfterReload = { field, path: window.location.pathname }
    }
  }, [field])

  return (
    <TableHead className={className} aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => toggleSort(field, firstDirection)}
        className="flex cursor-pointer select-none items-center gap-1 rounded-sm text-left ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {label}
        {direction === "asc" ? (
          <ArrowUp aria-hidden="true" className="h-3 w-3" />
        ) : direction === "desc" ? (
          <ArrowDown aria-hidden="true" className="h-3 w-3" />
        ) : (
          <ArrowUpDown aria-hidden="true" className="h-3 w-3 text-muted-foreground/40" />
        )}
      </button>
    </TableHead>
  )
}

export interface SortOption {
  field: string
  direction: SortDirection
  label: string
}

interface SortSelectProps {
  options: SortOption[]
  sort: string
  order: string
  onChange(field: string, direction: SortDirection): void
  className?: string
}

export function SortSelect({ options, sort, order, onChange, className }: SortSelectProps) {
  const value = `${sort}:${order}`
  const known = options.some((option) => `${option.field}:${option.direction}` === value)
  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      Sort by
      <select
        value={known ? value : ""}
        onChange={(event) => {
          const option = options.find((entry) => `${entry.field}:${entry.direction}` === event.target.value)
          if (option) onChange(option.field, option.direction)
        }}
        className={adminSelectClass}
      >
        {!known && <option value="">Other order</option>}
        {options.map((option) => (
          <option key={`${option.field}:${option.direction}`} value={`${option.field}:${option.direction}`}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
