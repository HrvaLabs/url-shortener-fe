"use client"

import { Suspense, useEffect, useId, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAllUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/useUsers"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { Pagination } from "@/components/ui/pagination"
import type { SignInMethod, User, UserFilters } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, ToggleLeft, ToggleRight, Search, UserX, UserCheck, Globe, Route } from "lucide-react"
import { toast } from "sonner"
import { parseServerDateTime } from "@/lib/analytics"
import { formatDateTime, plural } from "@/lib/utils"
import { adminApi, ApiError } from "@/lib/api-client"
import { PageMeta } from "@/components/page-meta"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { SortHead, SortSelect, adminSelectClass, type SortOption } from "@/components/admin/sort-controls"
import { providerLabels, type SignInProvider } from "@/lib/admin-stats"
import { SIGN_IN_METHODS, signInMethodLabels } from "@/lib/sign-in-methods"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import { DomainLimitDialog } from "@/components/admin/domain-limit-dialog"
import { DestinationChangesDialog } from "@/components/admin/destination-changes-dialog"
import { standingText } from "@/lib/link-edit"

const sortFields = ["createDate", "email", "lastLogin", "active", "links", "clicks"]

const sortOptions: SortOption[] = [
  { field: "createDate", direction: "desc", label: "Newest first" },
  { field: "createDate", direction: "asc", label: "Oldest first" },
  { field: "email", direction: "asc", label: "Email, A to Z" },
  { field: "email", direction: "desc", label: "Email, Z to A" },
  { field: "lastLogin", direction: "desc", label: "Last login, latest first" },
  { field: "lastLogin", direction: "asc", label: "Last login, earliest first" },
  { field: "links", direction: "desc", label: "Most links first" },
  { field: "links", direction: "asc", label: "Fewest links first" },
  { field: "clicks", direction: "desc", label: "Most clicks first" },
  { field: "clicks", direction: "asc", label: "Fewest clicks first" },
  { field: "active", direction: "desc", label: "Active first" },
  { field: "active", direction: "asc", label: "Inactive first" },
]

const providerLabel = (provider: string | undefined) => providerLabels[(provider ?? "local") as SignInProvider] ?? provider

const countText = (count: number | undefined) => (count === undefined ? "—" : count.toLocaleString())

const countLabel = (count: number | undefined, word: string) => (count === undefined ? `— ${word}s` : plural(count, word))

const lastLoginText = (lastLogin: string | null | undefined) => (lastLogin ? formatDateTime(parseServerDateTime(lastLogin)) : "Never")

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsers />
    </Suspense>
  )
}

function AdminUsers() {
  const { page, size, sort, order, setPage, setSize, toggleSort, setSortOrder, sortDir } = usePagination("createDate", "desc", sortFields)
  const { search, searchInput, setSearchInput } = useListSearch()
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [scammersOnly, setScammersOnly] = useState(false)
  const [signInFilter, setSignInFilter] = useState<SignInMethod | "all">("all")
  useEffect(() => { setPage(0) }, [search, activeFilter, scammersOnly, signInFilter, setPage])
  const filterKey = `${search}-${activeFilter}-${scammersOnly}-${signInFilter}`
  const filters: UserFilters = {
    search: search || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    possibleScammer: scammersOnly || undefined,
    signInMethod: signInFilter === "all" ? undefined : signInFilter,
  }
  const { data: users, isLoading, error } = useAllUsers(filters, page, size, sort, order)
  useClampedPage(page, users?.totalPages, setPage)
  const queryClient = useQueryClient()
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const [editUser, setEditUser] = useState<User | null>(null)
  const [domainLimitUser, setDomainLimitUser] = useState<User | null>(null)
  const domainLimitTrigger = useRef<HTMLElement | null>(null)
  const [standingUser, setStandingUser] = useState<User | null>(null)
  const standingTrigger = useRef<HTMLElement | null>(null)
  const [editEmail, setEditEmail] = useState("")
  const [editSlots, setEditSlots] = useState("")
  const editId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const removeTriggerRef = useRef<HTMLElement | null>(null)
  const removalFocus = useRowRemovalFocus(searchRef)

  const handleEdit = (user: User) => {
    setEditUser(user)
    setEditEmail(user.email)
    setEditSlots(String(user.apiKeySlots ?? ""))
  }

  const handleEditSave = async () => {
    if (!editUser) return
    try {
      await updateUser.mutateAsync({
        id: editUser.id,
        data: {
          id: editUser.id,
          email: editEmail,
          apiKeySlots: parseInt(editSlots) || editUser.apiKeySlots,
          active: editUser.active,
        },
      })
      toast.success("User updated")
      setEditUser(null)
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to update user")
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          id: user.id,
          active: !user.active,
        },
      })
      toast.success(user.active ? "User deactivated" : "User activated")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to toggle user status")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteUser.mutateAsync(id)
      toast.success("User deleted permanently")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to delete user")
    }
  }

  const setBusy = (id: number, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })

  const handleBlock = async (user: User, block: boolean) => {
    if (busyIds.has(user.id)) return
    setBusy(user.id, true)
    try {
      const result = await (block ? adminApi.blockUser(user.id) : adminApi.unblockUser(user.id))
      const count = result?.linksAffected ?? 0
      toast.success(`${block ? "Blocked" : "Restored"} ${count.toLocaleString()} link${count === 1 ? "" : "s"}`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["urls"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
      ])
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : block ? "Failed to block the user" : "Failed to unblock the user")
    } finally {
      setBusy(user.id, false)
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Users" description="Manage all registered users on hrva.cc." />
      <div>
        <h1 className="font-display text-2xl">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all registered users</p>
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${editId}-email`}>Email</Label>
                <Input
                  id={`${editId}-email`}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={!!(editUser?.authProvider && editUser.authProvider !== "local")}
                  className="mt-2"
                />
                {editUser?.authProvider && editUser.authProvider !== "local" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Email is managed by {editUser.authProvider === "google" ? "Google" : "GitHub"}. Cannot be changed here.
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Sign-in methods</p>
                {editUser.signInMethods && editUser.signInMethods.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {editUser.signInMethods.map((use) => (
                      <li key={use.method} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <Badge variant={use.method === "PASSWORD" ? "outline" : "secondary"} className="whitespace-nowrap">{signInMethodLabels[use.method] ?? use.method}</Badge>
                        <span className="tabular-nums text-muted-foreground">Last used {formatDateTime(parseServerDateTime(use.lastUsedAt))}</span>
                        {use.turnedOffAt && (
                          <span className="tabular-nums text-muted-foreground">Turned off {formatDateTime(parseServerDateTime(use.turnedOffAt))}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">None recorded yet</p>
                )}
              </div>
              <div>
                <Label htmlFor={`${editId}-slots`}>API key slots</Label>
                <Input id={`${editId}-slots`} type="number" value={editSlots} onChange={(e) => setEditSlots(e.target.value)} className="mt-2" />
              </div>
              <Button onClick={handleEditSave} disabled={updateUser.isPending} className="w-full">
                {updateUser.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DomainLimitDialog user={domainLimitUser} returnFocusRef={domainLimitTrigger} onOpenChange={(open) => { if (!open) setDomainLimitUser(null) }} />
      <DestinationChangesDialog user={standingUser} returnFocusRef={standingTrigger} onOpenChange={(open) => { if (!open) setStandingUser(null) }} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search users..."
            aria-label="Search users by email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          aria-label="Filter by status"
          className={adminSelectClass}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={signInFilter}
          onChange={(e) => setSignInFilter(e.target.value as SignInMethod | "all")}
          aria-label="Filter by sign-in method"
          className={adminSelectClass}
        >
          <option value="all">All sign-in methods</option>
          {SIGN_IN_METHODS.map((method) => (
            <option key={method} value={method}>{signInMethodLabels[method]}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={scammersOnly}
            onChange={(e) => setScammersOnly(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Possible scammers only
        </label>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={setSortOrder} className="@min-[61.5rem]:hidden" />
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load users</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : !users || !users.content || users.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">No users found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
        </div>
      ) : (
        <div key={filterKey} className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden @min-[61.5rem]:table-cell">ID</TableHead>
                <SortHead field="email" label="Email" sortDir={sortDir} toggleSort={toggleSort} />
                <TableHead className="hidden @min-[47rem]:table-cell">Sign-in methods</TableHead>
                <SortHead field="links" label="Links" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[61.5rem]:table-cell" />
                <SortHead field="clicks" label="Clicks" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[61.5rem]:table-cell" />
                <SortHead field="createDate" label="Created" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[47rem]:table-cell" />
                <SortHead field="lastLogin" label="Last login" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[61.5rem]:table-cell" />
                <SortHead field="active" label="Status" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[47rem]:table-cell" />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.content?.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="hidden tabular-nums text-muted-foreground @min-[61.5rem]:table-cell">{user.id}</TableCell>
                  <TableCell>
                    <div className="flex min-w-40 flex-wrap items-center gap-1.5 font-medium">
                      <span className="min-w-0 [overflow-wrap:anywhere]">{user.email}</span>
                      {user.possibleScammer && <Badge variant="warning" className="whitespace-nowrap">Possible scammer</Badge>}
                    </div>
                    {user.destinationChanges && (
                      <p className="mt-1 min-w-40 text-xs text-muted-foreground [overflow-wrap:anywhere]">{standingText(user.destinationChanges)}</p>
                    )}
                    <div className="mt-1 min-w-40 space-y-1 text-xs tabular-nums text-muted-foreground @min-[61.5rem]:hidden">
                      <div className="flex flex-wrap items-center gap-1.5 @min-[47rem]:hidden">
                        <SignInMethodBadges user={user} />
                        <ActiveBadge active={user.active} />
                      </div>
                      <p>ID {user.id} · {countLabel(user.links, "link")} · {countLabel(user.clicks, "click")}</p>
                      <p className="@min-[47rem]:hidden">Created {user.createDate ? formatDateTime(parseServerDateTime(user.createDate)) : "—"}</p>
                      <p>Last login {lastLoginText(user.lastLogin)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden @min-[47rem]:table-cell">
                    <SignInMethodBadges user={user} />
                  </TableCell>
                  <TableCell className="hidden tabular-nums @min-[61.5rem]:table-cell">{countText(user.links)}</TableCell>
                  <TableCell className="hidden tabular-nums @min-[61.5rem]:table-cell">{countText(user.clicks)}</TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground @min-[47rem]:table-cell">
                    {user.createDate ? <DateTimeLines value={user.createDate} /> : "—"}
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground @min-[61.5rem]:table-cell">
                    {user.lastLogin ? <DateTimeLines value={user.lastLogin} /> : "Never"}
                  </TableCell>
                  <TableCell className="hidden @min-[47rem]:table-cell">
                    <ActiveBadge active={user.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)} aria-label="Edit user" title="Edit user">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => {
                          domainLimitTrigger.current = event.currentTarget
                          setDomainLimitUser(user)
                        }} aria-label="Domain limit" title="Domain limit">
                        <Globe className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => {
                          standingTrigger.current = event.currentTarget
                          setStandingUser(user)
                        }} aria-label="Destination changes" title="Destination changes">
                        <Route className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(user)}
                        disabled={updateUser.isPending}
                        title={user.active ? "Deactivate user" : "Activate user"}
                        aria-label={user.active ? "Deactivate user" : "Activate user"}
                      >
                        {user.active
                          ? <ToggleRight className="h-4 w-4 text-success" />
                          : <ToggleLeft className="h-4 w-4 text-destructive" />
                        }
                      </Button>
                      {user.active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                              onClick={(e) => { if (busyIds.has(user.id)) e.preventDefault() }}
                              aria-disabled={busyIds.has(user.id)}
                              aria-label="Block user"
                              title="Block user"
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Block <span className="break-all">{user.email}</span>?</AlertDialogTitle>
                              <AlertDialogDescription>Deactivates the account, revokes its API keys and blocks all its links.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleBlock(user, true)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Block user</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                              onClick={(e) => { if (busyIds.has(user.id)) e.preventDefault() }}
                              aria-disabled={busyIds.has(user.id)}
                              aria-label="Unblock user"
                              title="Unblock user"
                            >
                              <UserCheck className="h-4 w-4 text-success" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Unblock <span className="break-all">{user.email}</span>?</AlertDialogTitle>
                              <AlertDialogDescription>Their account is reactivated and links blocked with them are restored.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleBlock(user, false)}>Unblock user</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            data-remove-row
                            onClick={(event) => { removeTriggerRef.current = event.currentTarget }}
                            aria-label="Delete user"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onCloseAutoFocus={removalFocus.onCloseAutoFocus}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete user?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete <span className="[overflow-wrap:anywhere]">{user.email}</span>. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { removalFocus.capture(removeTriggerRef.current); handleDelete(user.id) }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={users?.totalPages ?? 0}
            totalElements={users?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}
    </div>
  )
}

function SignInMethodBadges({ user }: { user: User }) {
  if (!user.signInMethods || user.signInMethods.length === 0) return <ProviderBadge provider={user.authProvider} />
  return (
    <div className="flex flex-wrap gap-1.5">
      {user.signInMethods.map((use) => (
        <Badge key={use.method} variant={use.method === "PASSWORD" ? "outline" : "secondary"} className="whitespace-nowrap">
          {signInMethodLabels[use.method] ?? use.method}
        </Badge>
      ))}
    </div>
  )
}

function ProviderBadge({ provider }: { provider: string | undefined }) {
  return (
    <Badge variant={provider && provider !== "local" ? "secondary" : "outline"} className="whitespace-nowrap">
      {providerLabel(provider)}
    </Badge>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? "success" : "destructive"}>{active ? "Active" : "Inactive"}</Badge>
}
