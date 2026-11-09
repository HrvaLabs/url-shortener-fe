"use client"

import { useId, useState } from "react"
import { flushSync } from "react-dom"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import { ALIASES_PAUSED, aliasFieldShown } from "@/lib/moderation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UtmFields } from "@/components/utm-fields"
import { DomainPicker } from "@/components/domains/domain-picker"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Check } from "lucide-react"
import { ApiError } from "@/lib/api-client"
import { destinationLengthError, shortHostOf, shortLinkOf, VISIT_LIMIT_HINT, withQrMarker } from "@/lib/utils"
import { shortHost } from "@/lib/domains"
import type { DomainRef } from "@/lib/types"
import { CANT_TAKE_UTM, destinationToSend, rememberUtm, tooLongMessage, tooLongWithUtm, type UtmValues } from "@/lib/utm"

interface CreateUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus?: (event: Event) => void
  initialAlias?: string
}

export function CreateUrlDialog({ open, onOpenChange, onCloseAutoFocus, initialAlias }: CreateUrlDialogProps) {
  const [longUrl, setLongUrl] = useState("")
  const [typedAlias, setTypedAlias] = useState<string | null>(null)
  const customAlias = typedAlias ?? initialAlias ?? ""
  const [domain, setDomain] = useState<string | null>(null)
  const [domainError, setDomainError] = useState<string | null>(null)
  const [visitLimit, setVisitLimit] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [tags, setTags] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [utm, setUtm] = useState<UtmValues>({})
  const [utmOpen, setUtmOpen] = useState(false)
  const [result, setResult] = useState<{ shortUrl: string; longUrl: string; domain: DomainRef | null } | null>(null)
  const [copied, setCopied] = useState(false)
  const createUrl = useCreateUrl()
  const { data: publicSettings } = usePublicSettings()
  const showAlias = aliasFieldShown(publicSettings, domain)
  const longUrlError = destinationLengthError(longUrl)
  const id = useId()

  const focusDestination = (event: Event) => {
    if (!initialAlias) return
    event.preventDefault()
    document.getElementById(`${id}-long-url`)?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl || longUrlError) return
    const destination = destinationToSend(longUrl, utmOpen, utm)
    if (destination === null) {
      toast.error(`${CANT_TAKE_UTM} Collapse Campaign tracking (UTM) to save it as typed.`)
      return
    }
    if (tooLongWithUtm(longUrl, destination)) {
      toast.error(tooLongMessage("long URL"))
      return
    }
    const expDate = expirationDate ? new Date(expirationDate).toISOString() : undefined
    setDomainError(null)
    setPasswordError(null)
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean)
      const url = await createUrl.mutateAsync({
        longUrl: destination,
        shortUrl: showAlias ? customAlias || undefined : undefined,
        visitLimit: visitLimit ? parseInt(visitLimit) : undefined,
        expirationDate: expDate,
        tags: tagList.length ? tagList : undefined,
        password: password || undefined,
        domain: domain || undefined,
      })
      if (utmOpen) rememberUtm(utm)
      setResult({ shortUrl: url.shortUrl, longUrl: url.longUrl, domain: url.domain ?? null })
      toast.success("URL shortened!")
    } catch (err) {
      if (domain !== null && err instanceof ApiError && err.fields.domain) {
        const message = err.fields.domain
        flushSync(() => setDomainError(message))
        document.getElementById(`${id}-domain`)?.focus()
        return
      }
      if (err instanceof ApiError && err.fields.password) {
        const message = err.fields.password
        flushSync(() => setPasswordError(message))
        document.getElementById(`${id}-password`)?.focus()
        return
      }
      toast.error(err instanceof Error && err.message ? err.message : "Failed to create URL")
    }
  }

  const handleClose = () => {
    setLongUrl("")
    setTypedAlias(null)
    setDomain(null)
    setDomainError(null)
    setVisitLimit("")
    setExpirationDate("")
    setTags("")
    setPassword("")
    setPasswordError(null)
    setUtm({})
    setUtmOpen(false)
    setResult(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" onOpenAutoFocus={focusDestination} onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{result ? "URL Created!" : "Create Short URL"}</DialogTitle>
          {!result && <DialogDescription>Enter a long URL to shorten it.</DialogDescription>}
        </DialogHeader>
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor={`${id}-long-url`}>Long URL</Label>
              <Input id={`${id}-long-url`} placeholder="https://example.com/very/long/url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required aria-invalid={!!longUrlError} aria-describedby={longUrlError ? "create-long-url-error" : undefined} className="mt-2" />
              {longUrlError && <p id="create-long-url-error" className="mt-2 text-sm text-destructive">{longUrlError}</p>}
            </div>
            <DomainPicker id={`${id}-domain`} value={domain} onChange={(picked) => { setDomain(picked); setDomainError(null) }} error={domainError} />
            {!showAlias && <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{ALIASES_PAUSED}</p>}
            {showAlias && (
              <div>
                <Label htmlFor={`${id}-alias`}>Custom alias (optional)</Label>
                <div className="mt-2 flex min-h-10 overflow-hidden rounded-lg border border-input bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                  <span className="flex min-w-0 max-w-[60%] select-none items-center border-r bg-muted/60 px-3 py-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">{shortHostOf(domain)}/</span>
                  <input id={`${id}-alias`} placeholder="my-link" value={customAlias} onChange={(e) => setTypedAlias(e.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-hidden placeholder:text-muted-foreground" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor={`${id}-visit-limit`}>Visit limit (optional)</Label>
              <Input id={`${id}-visit-limit`} type="number" placeholder="e.g. 100" value={visitLimit} onChange={(e) => setVisitLimit(e.target.value)} aria-describedby={`${id}-visit-limit-hint`} className="mt-2" />
              <p id={`${id}-visit-limit-hint`} className="mt-1.5 text-xs text-muted-foreground">{VISIT_LIMIT_HINT}</p>
            </div>
            <div>
              <Label htmlFor={`${id}-tags`}>Tags (optional, comma-separated)</Label>
              <Input id={`${id}-tags`} placeholder="work, personal" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor={`${id}-password`}>Password (optional)</Label>
              <Input
                id={`${id}-password`}
                type="password"
                placeholder="Protect this link"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null) }}
                autoComplete="new-password"
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? `${id}-password-error` : undefined}
                className="mt-2"
              />
              {passwordError && (
                <p id={`${id}-password-error`} role="alert" className="mt-2 text-sm text-destructive [overflow-wrap:anywhere]">{passwordError}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${id}-expires`}>Expiration date (optional)</Label>
              <Input id={`${id}-expires`} type="datetime-local" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-2" />
            </div>
            <UtmFields destination={longUrl} value={utm} onChange={setUtm} open={utmOpen} onOpenChange={setUtmOpen} variant="dialog" />
            <Button type="submit" className="w-full" disabled={createUrl.isPending}>
              {createUrl.isPending ? "Shortening..." : "Shorten"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
              <span className="min-w-0 font-mono text-sm font-medium text-brand [overflow-wrap:anywhere]"><span className="font-normal text-muted-foreground">{shortHost(result.domain, shortHostOf())}/</span>{result.shortUrl}</span>
              <Button variant="ghost" size="icon" aria-label="Copy short URL" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => {
                navigator.clipboard.writeText(shortLinkOf(result))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
                toast.success("Copied!")
              }}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Opens:</span> <span className="break-all">{result.longUrl}</span>
            </p>
            <div className="flex justify-center">
              <div className="inline-block rounded-lg border bg-white p-2">
                <QRCodeSVG value={withQrMarker(shortLinkOf(result))} size={150} fgColor="#0e0e11" bgColor="#ffffff" />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
