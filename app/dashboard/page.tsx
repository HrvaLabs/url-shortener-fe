"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMyUrls, useActivateUrl, useDeactivateUrl, useDeleteUrl } from "@/lib/hooks/useUrls"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { useMyApiKeys } from "@/lib/hooks/useApiKeys"
import { Pagination } from "@/components/ui/pagination"
import type { UrlResponse, UrlFilters } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { useQuery } from "@tanstack/react-query"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { selectChevronClass } from "@/components/ui/select-chevron"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QrCustomizer } from "@/components/qr-customizer"
import { Copy, ExternalLink, QrCode, Search, Trash2, ToggleLeft, ToggleRight, BarChart3, Plus, Download, ArrowUpDown, ArrowUp, ArrowDown, Lock, Pencil } from "lucide-react"
import { toast } from "sonner"
import { cn, formatDateTime, formatRelativeDate, formatShortUrl, opensText, shortHostOf } from "@/lib/utils"
import { urlApi } from "@/lib/api-client"
import { analyticsHref, parseServerDateTime } from "@/lib/analytics"
import { isAliasShaped } from "@/lib/claim"
import { CreateUrlDialog } from "@/components/dashboard/create-url-dialog"
import { EditLinkDialog } from "@/components/edit-link-dialog"
import { SignupSourceCard } from "@/components/dashboard/signup-source-card"
import { PageMeta } from "@/components/page-meta"
import { DestinationHealthBadge } from "@/components/notifications/destination-health-badge"
import { LiveNumber } from "@/components/live-number"
import { StaleDataNotice } from "@/components/stale-data-notice"
import { liveStamp, liveState } from "@/lib/live"
import { shortHost } from "@/lib/domains"

const selectClass = cn(
  "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0",
  selectChevronClass,
)

const rowActionClass = "h-8 w-8 text-muted-foreground hover:text-foreground"
const primaryHost = shortHostOf()

const sortFields = ["createDate", "visits", "expirationDate"]

function SortIcon({ dir }: { dir: string | null }) {
  if (dir === "asc") return <ArrowUp className="h-3 w-3 text-foreground" />
  if (dir === "desc") return <ArrowDown className="h-3 w-3 text-foreground" />
  return <ArrowUpDown className="h-3 w-3 opacity-40" />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  )
}

function Dashboard() {
  const { page, size, sort, order, setPage, setSize, toggleSort, sortDir } = usePagination("createDate", "desc", sortFields)
  const { search, searchInput, setSearchInput } = useListSearch()
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [expiredFilter, setExpiredFilter] = useState(false)
  const [tagFilter, setTagFilter] = useState<string>("")
  useEffect(() => { setPage(0) }, [search, activeFilter, expiredFilter, tagFilter, setPage])
  const filterKey = `${search}-${activeFilter}-${expiredFilter}-${tagFilter}`
  const filters: UrlFilters = {
    search: search || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    expired: expiredFilter || undefined,
    tag: tagFilter || undefined,
  }
  const { data: myTags } = useQuery({ queryKey: ["urls", "tags"], queryFn: () => urlApi.getMyTags() })
  const urlsQuery = useMyUrls(filters, page, size, sort, order, true)
  const { data: urls, isLoading, error, refetch } = urlsQuery
  const listState = liveState(error, !!urls)
  const stamp = liveStamp(urlsQuery)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const deactivateUrl = useDeactivateUrl()
  const activateUrl = useActivateUrl()
  useClampedPage(page, urls?.totalPages, setPage)
  const deleteUrl = useDeleteUrl()
  const { data: apiKeys } = useMyApiKeys()
  const totalKeys = apiKeys?.length ?? 0
  const activeKeys = apiKeys?.filter(k => k.active).length ?? 0
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [claimedAlias, setClaimedAlias] = useState<string | undefined>(undefined)
  const router = useRouter()
  const searchParams = useSearchParams()
  const aliasParam = searchParams.get("alias")
  const [seenAlias, setSeenAlias] = useState<string | null>(null)
  if (aliasParam !== seenAlias) {
    setSeenAlias(aliasParam)
    if (aliasParam !== null && isAliasShaped(aliasParam)) {
      setClaimedAlias(aliasParam)
      setShowCreateDialog(true)
    }
  }
  useEffect(() => {
    if (aliasParam !== null) router.replace("/dashboard")
  }, [aliasParam, router])
  const newUrlButtonRef = useRef<HTMLButtonElement>(null)
  const createOpenerRef = useRef<HTMLElement | null>(null)
  const [copyPulseId, setCopyPulseId] = useState<number | null>(null)
  const [editUrl, setEditUrl] = useState<UrlResponse | null>(null)
  const editOpenerRef = useRef<HTMLElement | null>(null)

  const openEditDialog = (event: React.MouseEvent<HTMLElement>, url: UrlResponse) => {
    editOpenerRef.current = event.currentTarget
    setEditUrl(url)
  }

  const focusEditOpener = (event: Event) => {
    const opener = editOpenerRef.current
    editOpenerRef.current = null
    if (!opener?.isConnected) return
    event.preventDefault()
    opener.focus()
  }

  const openCreateDialog = (event: React.MouseEvent<HTMLElement>) => {
    createOpenerRef.current = event.currentTarget
    setShowCreateDialog(true)
  }

  const focusCreateOpener = (event: Event) => {
    event.preventDefault()
    const opener = createOpenerRef.current
    createOpenerRef.current = null
    const target = opener?.isConnected ? opener : newUrlButtonRef.current
    target?.focus()
  }

  const copyToClipboard = (text: string, id?: number) => {
    navigator.clipboard.writeText(text)
    if (id != null) {
      setCopyPulseId(id)
      setTimeout(() => setCopyPulseId(null), 400)
    }
    toast.success("Copied!")
  }

  const handleActivate = async (id: number) => {
    try {
      await activateUrl.mutateAsync(id)
      toast.success("URL reactivated")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to reactivate")
    }
  }

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateUrl.mutateAsync(id)
      toast.success("URL deactivated")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to deactivate")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteUrl.mutateAsync(id)
      toast.success("URL deleted permanently")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — My URLs" description="Manage and track your shortened URLs on hrva.cc." />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">My URLs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and track your shortened links</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => urlApi.exportCsv()} variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button ref={newUrlButtonRef} onClick={openCreateDialog} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New URL
          </Button>
        </div>
      </div>

      <SignupSourceCard onDone={() => newUrlButtonRef.current?.focus()} />

      <CreateUrlDialog
        open={showCreateDialog}
        onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setClaimedAlias(undefined) }}
        onCloseAutoFocus={focusCreateOpener}
        initialAlias={claimedAlias}
      />
      <EditLinkDialog link={editUrl} onOpenChange={(open) => { if (!open) setEditUrl(null) }} onCloseAutoFocus={focusEditOpener} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search URLs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {myTags && myTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filter by tag"
            className={selectClass}
          >
            <option value="">All tags</option>
            {myTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <label className="flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap px-1 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={expiredFilter}
            onChange={(e) => setExpiredFilter(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Expired only
        </label>
        <p className="w-full text-sm text-muted-foreground sm:ml-auto sm:w-auto">
          <span className="font-medium tabular-nums text-foreground">{urls?.totalElements ?? urls?.content?.length ?? 0}</span> URLs
          <span className="mx-2 text-muted-foreground/50">·</span>
          <span className="font-medium tabular-nums text-foreground">{activeKeys}/{totalKeys}</span> API keys active
        </p>
      </div>

      {listState === "stale" && (
        <StaleDataNotice message="Couldn't refresh the list. It may be out of date." onRetry={() => refetch()} returnFocusTo={headingRef} />
      )}

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : listState === "failed" ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm text-destructive">Failed to load URLs</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : !urls || !urls.content || urls.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <h2 className="font-semibold">No URLs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Shorten your first URL to get started!</p>
          <Button onClick={openCreateDialog} size="sm" className="mt-6 gap-1.5">
            <Plus className="h-4 w-4" />
            Shorten a URL
          </Button>
        </div>
      ) : (
        <div key={filterKey} className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Short URL</TableHead>
                <TableHead className="hidden md:table-cell">Long URL</TableHead>
                <TableHead
                  title="Daily unique visitors, added up"
                  aria-sort={sortDir("visits") === "asc" ? "ascending" : sortDir("visits") === "desc" ? "descending" : undefined}
                >
                  <button type="button" onClick={() => toggleSort("visits")} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                    Visits
                    <SortIcon dir={sortDir("visits")} />
                  </button>
                </TableHead>
                <TableHead
                  className="hidden lg:table-cell"
                  aria-sort={sortDir("createDate") === "asc" ? "ascending" : sortDir("createDate") === "desc" ? "descending" : undefined}
                >
                  <button type="button" onClick={() => toggleSort("createDate")} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                    Created
                    <SortIcon dir={sortDir("createDate")} />
                  </button>
                </TableHead>
                <TableHead
                  className="hidden lg:table-cell"
                  aria-sort={sortDir("expirationDate") === "asc" ? "ascending" : sortDir("expirationDate") === "desc" ? "descending" : undefined}
                >
                  <button type="button" onClick={() => toggleSort("expirationDate")} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
                    Expires
                    <SortIcon dir={sortDir("expirationDate")} />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls.content.map((url: UrlResponse) => (
                <TableRow key={url.id}>
                  <TableCell className="min-w-52">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formatShortUrl(url.shortUrl, url.domain?.hostname), url.id)}
                        className="min-w-0 text-left font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere] hover:underline"
                      >
                        <span className="font-normal text-muted-foreground">{shortHost(url.domain, primaryHost)}/</span>{url.shortUrl}
                      </button>
                      {url.passwordProtected && (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Password protected" />
                      )}
                    </div>
                    <DestinationHealthBadge health={url.destinationHealth} active={url.status ? url.status === "ACTIVE" : url.active} emailPrompt className="md:hidden" />
                  </TableCell>
                  <TableCell className="hidden min-w-56 md:table-cell">
                    <span className="block break-all text-sm text-muted-foreground">{url.longUrl}</span>
                    <DestinationHealthBadge health={url.destinationHealth} active={url.status ? url.status === "ACTIVE" : url.active} emailPrompt />
                    {url.tags && url.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {url.tags.map((t) => (
                          <Badge key={t} variant="outline" className="px-1.5 py-px text-xs font-normal text-muted-foreground">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <LiveNumber value={url.visits} stamp={stamp} className="text-sm font-medium tabular-nums" />
                    {url.visitLimit > 0 && (
                      <div className="mt-1 flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                        <Progress value={((url.opens ?? 0) / url.visitLimit) * 100} className="h-1.5 w-12 shrink-0" />
                        <span>{opensText(url)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden min-w-32 text-sm tabular-nums text-muted-foreground lg:table-cell">{formatDateTime(parseServerDateTime(url.createDate))}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm tabular-nums lg:table-cell">{formatRelativeDate(url.expirationDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={url.status} active={url.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Copy short URL"
                            onClick={() => copyToClipboard(formatShortUrl(url.shortUrl, url.domain?.hostname), url.id)}
                            className={cn(rowActionClass, copyPulseId === url.id && "animate-copy-pulse text-brand hover:text-brand")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Copy short URL</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit link"
                            onClick={(event) => openEditDialog(event, url)}
                            className={rowActionClass}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit link</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className={rowActionClass}>
                            <Link href={analyticsHref({ link: url.id })} aria-label="View stats">
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">View stats</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className={rowActionClass}>
                            <a href={url.longUrl} target="_blank" rel="noopener noreferrer" aria-label="Open original URL">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Open original URL</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <Dialog>
                          <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Show QR code" className={rowActionClass}>
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">Show QR code</TooltipContent>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>QR Code</DialogTitle>
                            </DialogHeader>
                            <QrCustomizer value={formatShortUrl(url.shortUrl, url.domain?.hostname)} filename={`${url.domain ? `${url.domain.hostname}-` : ""}${url.shortUrl}-qr`} />
                          </DialogContent>
                        </Dialog>
                      </Tooltip>

                      {url.active && (
                        <Tooltip>
                          <AlertDialog>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Deactivate URL"
                                  className={rowActionClass}
                                  disabled={deactivateUrl.isPending}
                                >
                                  <ToggleRight className="h-4 w-4 text-success" />
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top">Deactivate URL</TooltipContent>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate URL?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will deactivate the short link. Anyone clicking it will no longer be redirected. You can reactivate it later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(url.id)} className={buttonVariants({ variant: "destructive" })}>
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </Tooltip>
                      )}
                      {!url.active && url.status === "DEACTIVATED" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Reactivate URL"
                              className={rowActionClass}
                              disabled={activateUrl.isPending}
                              onClick={() => handleActivate(url.id)}
                            >
                              <ToggleLeft className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Reactivate URL</TooltipContent>
                        </Tooltip>
                      )}
                      {!url.active && url.status !== "DEACTIVATED" && <span aria-hidden="true" className="inline-block h-8 w-8" />}

                      <Tooltip>
                        <AlertDialog>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete URL"
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">Delete URL</TooltipContent>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete URL?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The URL will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(url.id)} className={buttonVariants({ variant: "destructive" })}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={urls?.totalPages ?? 0}
            totalElements={urls?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}
    </div>
  )
}
