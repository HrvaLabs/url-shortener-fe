"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import {
  ArrowRight, ArrowUpRight, BarChart3, Bell, Check, Clock, Contact, Copy, Fingerprint, Globe, KeyRound, Lock, Megaphone, Plus, QrCode, Search, Tag, Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ShortenForm } from "@/components/shorten-form"
import { EasterEggKonami } from "@/components/easter-egg-konami"
import { useAuth } from "@/lib/auth-context"
import { useAnonymousLinksPaused, usePublicSettings } from "@/lib/hooks/useSettings"
import { signupsPaused } from "@/lib/moderation"
import { useMyUrls } from "@/lib/hooks/useUrls"
import { cn, formatShortUrl, shortHostOf } from "@/lib/utils"
import { HOME_FAQS } from "@/lib/home-faq"
import { MIDDLE_DOT, SLOGAN } from "@/lib/seo"
import { SALT_GRACE_SOURCE, VISITOR_HASH_SOURCE } from "@/lib/source-links"

const PASSWORD_DOTS = String.fromCodePoint(0x2022).repeat(8)

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <EasterEggKonami />
      <SiteHeader />
      <main className="flex-1">{user ? <SignedInHome email={user.email} /> : <PublicHome />}</main>
      <SiteFooter />
    </div>
  )
}

function PublicHome() {
  const paused = useAnonymousLinksPaused()
  const { data: publicSettings } = usePublicSettings()

  return (
    <>
      <section className="overflow-hidden border-b">
        <div className="container pb-0 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.02]">{SLOGAN}</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A free, open-source URL shortener with no ads.
            </p>
          </div>

          <div id="shorten" className="mx-auto mt-10 max-w-2xl scroll-mt-24">
            <ShortenForm size="lg" />
            {!paused && !signupsPaused(publicSettings) && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                No account needed.{" "}
                <Link href="/register" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Sign up free
                </Link>{" "}
                for custom aliases, visit limits, expiry dates and analytics.
              </p>
            )}
            <nav aria-label="Free tools" className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Also free:</span>
              {freeTools.map((tool, index) => (
                <Fragment key={tool.href}>
                  {index > 0 && <span aria-hidden="true">{MIDDLE_DOT}</span>}
                  <Link href={tool.href} className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                    {tool.label}
                  </Link>
                </Fragment>
              ))}
            </nav>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <FeatureGrid />
      <PrivacySection />
      <DevelopersSection />
      <Faq />
      <ClosingCta />
    </>
  )
}

const freeTools = [
  { href: "/qr", label: "QR code generator" },
  { href: "/utm", label: "UTM builder" },
  { href: "/link-in-bio", label: "Bio pages" },
  { href: "/developers", label: "API" },
]

const previewRows = [
  { alias: "cv", destination: "drive.google.com/file/d/1Xa9kQ2mZpL7/view", visits: "1,284", tags: ["personal"], status: "Active" },
  { alias: "launch", destination: "github.com/HrvaLabs/url-shortener", visits: "312 / 500", tags: ["work"], status: "Limit 500" },
  { alias: "menu", destination: "bistro.example.com/menu/october", visits: "96", tags: ["food"], status: "Expires 31 Oct" },
  { alias: "team-photos", destination: "photos.example.com/album/4f2c81", visits: "47", tags: [], status: "Password" },
  { alias: "summer-23", destination: "events.example.com/summer-2023", visits: "2,019", tags: ["events"], status: "Expired" },
]

function DashboardPreview() {
  return (
    <figure className="relative mx-auto mt-16 max-w-5xl">
      <div
        role="img"
        aria-label="Example of the hrva.cc links dashboard"
        className="overflow-hidden rounded-t-2xl border border-b-0 bg-card shadow-[0_-8px_48px_-16px_rgb(0_0_0/0.18)] mask-[linear-gradient(to_bottom,black_62%,transparent)]"
      >
        <div className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
          <span className="text-sm font-semibold">Links</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">5</span>
          <div className="ml-auto hidden h-8 w-56 items-center gap-2 rounded-lg border px-2.5 text-xs text-muted-foreground sm:flex">
            <Search className="h-3.5 w-3.5" />
            Search links
          </div>
          <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground sm:ml-0">
            <Plus className="h-3.5 w-3.5" />
            Create link
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_110px_120px] sm:px-5">
          <span>Short link</span>
          <span className="hidden sm:block">Destination</span>
          <span className="text-right sm:text-left">Visits</span>
          <span className="hidden sm:block">Status</span>
        </div>
        <ul className="divide-y">
          {previewRows.map((row) => (
            <li
              key={row.alias}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_110px_120px] sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]">hrva.cc/{row.alias}</span>
                {row.tags.map((tag) => (
                  <span key={tag} className="hidden rounded-md border px-1.5 py-px text-xs text-muted-foreground md:inline">
                    {tag}
                  </span>
                ))}
              </span>
              <span className="hidden min-w-0 text-muted-foreground [overflow-wrap:anywhere] sm:block">{row.destination}</span>
              <span className="text-right tabular-nums sm:text-left">{row.visits}</span>
              <span className="hidden sm:block">
                <PreviewStatus status={row.status} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="absolute -top-7 right-0 text-xs text-muted-foreground">Example data</figcaption>
    </figure>
  )
}

function PreviewStatus({ status }: { status: string }) {
  const tone =
    status === "Active"
      ? "bg-success/10 text-success"
      : status === "Expired"
        ? "bg-muted text-muted-foreground"
        : status === "Password"
          ? "bg-brand-soft text-brand"
          : "bg-warning/10 text-warning"
  const Icon = status === "Password" ? Lock : status.startsWith("Expires") ? Timer : null

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", tone)}>
      {Icon && <Icon className="h-3 w-3" />}
      {status}
    </span>
  )
}

const utmExample = [
  { label: "Source", value: "instagram" },
  { label: "Medium", value: "social" },
  { label: "Campaign", value: "autumn-sale" },
]

const visitsByDay = [18, 24, 21, 35, 30, 44, 39, 52, 47, 61, 58, 73, 66, 81]
const visitsScale = 90
const visitsTotal = visitsByDay.reduce((sum, value) => sum + value, 0)

function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-16 py-24 sm:py-28">
      <div className="container">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">Features</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Shortening works without an account. A free account adds the rest.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-3">
          <FeatureCell
            className="lg:col-span-2"
            icon={BarChart3}
            title="Link analytics"
            description="Clicks and daily unique visitors per link, with referrers, countries and devices, without storing who your visitors are. The numbers update every 10 seconds."
          >
            <div aria-hidden="true">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-mono text-[13px] font-medium text-brand">hrva.cc/launch</span>
                <span className="text-xs text-muted-foreground">Last 14 days</span>
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {visitsTotal.toLocaleString("en")} <span className="text-sm font-normal text-muted-foreground">clicks</span>
              </p>
              <div className="relative mt-5 h-44">
                {[0, 30, 60, 90].map((tick) => (
                  <div key={tick} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(tick / visitsScale) * 100}%` }}>
                    <span className="w-5 translate-y-1/2 text-right text-xs tabular-nums text-muted-foreground">{tick}</span>
                    <span className={cn("h-px flex-1 translate-y-1/2", tick === 0 ? "bg-border" : "bg-border/60")} />
                  </div>
                ))}
                <div className="absolute inset-y-0 left-7 right-0 flex items-end gap-1.5">
                  {visitsByDay.map((value, index) => {
                    const isToday = index === visitsByDay.length - 1
                    return (
                      <div key={index} className="relative flex h-full flex-1 items-end">
                        <div
                          className={cn("w-full rounded-t-[4px]", isToday ? "bg-brand" : "bg-brand/20")}
                          style={{ height: `${(value / visitsScale) * 100}%` }}
                        />
                        {isToday && (
                          <div
                            className="absolute right-0 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-[0_4px_12px_-2px_rgb(0_0_0/0.12)]"
                            style={{ bottom: `calc(${(value / visitsScale) * 100}% + 8px)` }}
                          >
                            <span className="text-muted-foreground">Today</span>{" "}
                            <span className="font-medium tabular-nums">{value} clicks</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="ml-7 mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </FeatureCell>

          <FeatureCell
            icon={QrCode}
            title="QR codes"
            description={
              <>
                Pick colours and size, then download as PNG or SVG. Link analytics count scans apart from other clicks.{" "}
                <Link href="/help/stats#qr-scans" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Learn more<span className="sr-only"> about QR scans</span>
                </Link>{" "}
                or{" "}
                <Link href="/qr" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  make one now, no account needed
                </Link>
                .
              </>
            }
          >
            <div aria-hidden="true">
              <div className="flex items-start gap-5">
                <div className="shrink-0 rounded-xl border bg-white p-2.5">
                  <QRCodeSVG value="https://hrva.cc" size={132} fgColor="#2251ff" bgColor="#ffffff" level="M" />
                </div>
                <div className="min-w-0 flex-1 space-y-4 pt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Colour</p>
                    <div className="mt-1.5 flex gap-1.5">
                      {["#0e0e11", "#2251ff", "#16a34a", "#e11d48"].map((color, index) => (
                        <span
                          key={color}
                          className={cn("h-5 w-5 rounded-full border border-black/10", index === 1 && "ring-2 ring-brand ring-offset-2 ring-offset-card")}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Size</span>
                      <span className="tabular-nums">220 px</span>
                    </div>
                    <div className="relative mt-2 h-1.5 rounded-full bg-muted">
                      <div className="h-full w-[45%] rounded-full bg-brand" />
                      <span className="absolute left-[45%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-background" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <span className="flex h-9 items-center justify-center rounded-lg border bg-background text-sm font-medium">Download PNG</span>
                <span className="flex h-9 items-center justify-center rounded-lg border bg-background text-sm font-medium">Download SVG</span>
              </div>
            </div>
          </FeatureCell>

          <FeatureCell icon={Clock} title="Visit limits and expiry" description="Links switch themselves off after a number of clicks or at a set time. Every click counts, not counting bots, and never more than the limit.">
            <div className="space-y-3 text-sm" aria-hidden="true">
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">Visit limit</span>
                <span className="tabular-nums">500</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-muted-foreground">Expires</span>
                <span className="tabular-nums">31 Dec 2026, 23:59</span>
              </div>
              <div className="pt-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[62%] rounded-full bg-brand" />
                </div>
                <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">312 of 500 clicks used</p>
              </div>
            </div>
          </FeatureCell>

          <FeatureCell icon={Lock} title="Password protection" description="Visitors enter a password before they are sent on.">
            <div className="rounded-xl border bg-background p-4" aria-hidden="true">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                This link is protected
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">hrva.cc/team-photos</p>
              <div className="mt-3 flex h-9 items-center rounded-lg border border-ring px-3 text-sm tracking-[0.3em] ring-4 ring-ring/15">
                {PASSWORD_DOTS}
              </div>
              <div className="mt-2 flex h-9 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
                Unlock link
              </div>
            </div>
          </FeatureCell>

          <FeatureCell icon={Tag} title="Tags and search" description="Tag links and filter the dashboard by tag, status or date.">
            <div aria-hidden="true">
              <div className="flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span>launch</span>
                <span className="h-4 w-px bg-brand" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["personal", "work", "launch", "events"].map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs",
                      tag === "work" ? "border-brand/40 bg-brand-soft text-brand" : "bg-background text-muted-foreground",
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ul className="mt-3 divide-y rounded-lg border bg-background text-sm">
                <li className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-[13px] text-brand">hrva.cc/launch</span>
                  <span className="text-xs tabular-nums text-muted-foreground">312</span>
                </li>
                <li className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-[13px] text-brand">hrva.cc/launch-notes</span>
                  <span className="text-xs tabular-nums text-muted-foreground">58</span>
                </li>
              </ul>
            </div>
          </FeatureCell>

          <FeatureCell
            className="lg:col-span-3"
            icon={Megaphone}
            title="Campaign tracking"
            description={
              <>
                Add UTM tags to any link with a free account, so your analytics tool can see where visitors came from.{" "}
                <Link href="/help/utm" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Learn more<span className="sr-only"> about campaign tracking</span>
                </Link>{" "}
                or use the{" "}
                <Link href="/utm" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  free UTM builder
                </Link>
                , no account needed. Tags added to the short link itself, like hrva.cc/abc?utm_source=mail, are passed on
                to the destination.
              </>
            }
          >
            <div aria-hidden="true">
              <div className="grid gap-3 sm:grid-cols-3">
                {utmExample.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className="mt-1.5 flex h-9 items-center rounded-lg border bg-background px-3 text-sm">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border bg-background px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Your link will open:</p>
                <p className="mt-1 break-all font-mono text-[13px]">
                  https://shop.example/sale?<span className="text-brand">utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=autumn-sale</span>
                </p>
              </div>
            </div>
          </FeatureCell>

          <FeatureCell
            className="lg:col-span-3"
            icon={KeyRound}
            title="Passkeys"
            description={
              <>
                Sign in with your fingerprint, face, screen lock or a security key. No password to type, and two-step
                verification works with them too. Settings lists every way you&apos;ve signed in, with when you last
                used each. Sign out everywhere signs out your other devices, and so does a password change. A reset link
                works once, for an hour, and signing up never shows whether an email already has an account.{" "}
                <Link href="/help/passkeys" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Learn more<span className="sr-only"> about passkeys</span>
                </Link>
              </>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
              <div className="rounded-xl border bg-background p-4">
                <p className="text-sm font-medium">Sign in to hrva.cc</p>
                <div className="mt-3 flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground">
                  <KeyRound className="h-3.5 w-3.5" />
                  Sign in with a passkey
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Fingerprint className="h-3.5 w-3.5 shrink-0" />
                  Touch the sensor to continue
                </p>
              </div>
              <ul className="divide-y self-start rounded-lg border bg-background text-sm">
                {[
                  { label: "MacBook", kind: "Synced passkey", synced: true },
                  { label: "YubiKey", kind: "Device-bound passkey", synced: false },
                ].map(({ label, kind, synced }) => (
                  <li key={label} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs",
                        synced ? "border-brand/40 bg-brand-soft text-brand" : "bg-background text-muted-foreground",
                      )}
                    >
                      {kind}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FeatureCell>

          <FeatureCell
            className="md:grid md:grid-cols-2 md:items-center lg:col-span-3"
            icon={Contact}
            title="Bio pages"
            description={
              <>
                One page with all your links at hrva.cc/@yourname, for your Instagram, TikTok or any other bio. Every button
                is one of your checked short links.{" "}
                <Link href="/link-in-bio" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Learn more<span className="sr-only"> about bio pages</span>
                </Link>
              </>
            }
          >
            <div aria-hidden="true" className="mx-auto w-[260px] max-w-full rounded-[2rem] border-2 bg-background px-5 pb-6 pt-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#0f766e] text-lg font-semibold text-white dark:bg-[#5eead4] dark:text-[#0b0b0e]">
                AH
              </div>
              <p className="mt-3 font-semibold [overflow-wrap:anywhere]">Ana Horvat</p>
              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">@ana</p>
              <ul className="mt-5 space-y-2.5">
                {["Instagram", "Portfolio", "Newsletter"].map((label) => (
                  <li
                    key={label}
                    className="rounded-xl bg-[#0f766e] px-4 py-2.5 text-sm font-medium text-white [overflow-wrap:anywhere] dark:bg-[#5eead4] dark:text-[#0b0b0e]"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </FeatureCell>

          <FeatureCell
            className="md:grid md:grid-cols-2 md:items-center lg:col-span-3"
            icon={Bell}
            title="Notifications"
            description={
              <>
                Nightly dead-link checks, a weekly summary, and alerts to Discord, Slack, Telegram, ntfy, a webhook or email.
                Everything is off until you turn it on.{" "}
                <Link href="/help/notifications" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Learn more<span className="sr-only"> about notifications</span>
                </Link>
              </>
            }
          >
            <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-xl border bg-background p-4">
              <p className="flex items-start gap-2 text-sm font-medium [overflow-wrap:anywhere]">
                <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                hrva.cc: 1 link looks broken
              </p>
              <p className="mt-1.5 pl-5.5 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
                hrva.cc/menu <span className="font-sans">to</span> example.com
              </p>
            </div>
          </FeatureCell>

          <FeatureCell
            className="md:grid md:grid-cols-2 md:items-center lg:col-span-3"
            icon={Globe}
            title="Custom domains"
            description={
              <>
                Short links on your own subdomain, like go.example.com/menu. Free, reviewed by a person, and set up for you
                after one DNS record.{" "}
                <Link href="/custom-domain-url-shortener" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
                  Learn more<span className="sr-only"> about custom domains</span>
                </Link>
              </>
            }
          >
            <div aria-hidden="true" className="mx-auto w-full max-w-sm space-y-2.5">
              <p className="flex items-start gap-2 rounded-xl border bg-background px-4 py-3 font-mono text-sm font-medium [overflow-wrap:anywhere]">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="text-brand">go.example.com</span>/menu
                </span>
              </p>
              <p className="flex items-start gap-2 rounded-xl border bg-background px-4 py-3 font-mono text-sm text-muted-foreground [overflow-wrap:anywhere]">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0">hrva.cc/menu</span>
              </p>
            </div>
          </FeatureCell>
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Also included:{" "}
          <Link href="/custom-short-links" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            custom aliases
          </Link>
          ,{" "}
          <Link href="/help/links#edit" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            editing links after you make them
          </Link>
          , two-factor sign-in, Google Safe Browsing checks of every destination when the link is made and every night, a blocklist check on every click, a warning page before links made without an account that look risky or are being checked, a check of new and changed links for pages that ask for a password or card details,{" "}
          <Link href="/help/install-app" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            an app you can install
          </Link>{" "}
          on your phone or computer, and a way to{" "}
          <Link href="/validate" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            see where a link goes before opening it
          </Link>
          . The public{" "}
          <Link href="/stats" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            hrva.cc in numbers
          </Link>{" "}
          page shows how many harmful links are blocked and how fast reports are reviewed. The{" "}
          <Link href="/security" className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
            security page
          </Link>{" "}
          lists what hrva.cc checks and protects.
        </p>
      </div>
    </section>
  )
}

function FeatureCell({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-6 bg-card p-6 sm:p-8", className)}>
      <div>
        <h3 className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  )
}

const privacyClaims = [
  { title: "No IPs stored", text: "Link statistics count unique visitors with a one-way hash under a random key that changes every day." },
  { title: "Gone by morning", text: "The hashes and the day's key are kept only in Redis and deleted a few hours after midnight. Daily counts stay." },
  { title: "Open source", text: "The code is on GitHub, including the lines shown here." },
  { title: "Free, no ads", text: "There are no paid plans, and personal data is not sold." },
]

const visitorHashUrl = VISITOR_HASH_SOURCE
const saltGraceUrl = SALT_GRACE_SOURCE

function PrivacySection() {
  return (
    <section className="border-y bg-muted/40 py-24 sm:py-28">
      <div className="container grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
        <div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">Private by default</h2>
          <dl className="mt-8 divide-y border-y">
            {privacyClaims.map((claim) => (
              <div key={claim.title} className="py-3.5 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-sm font-semibold">{claim.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground sm:mt-0">{claim.text}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy-first-url-shortener"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              How visits are counted without tracking
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Read the privacy policy
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <figure className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.4)]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-2.5">
            <span className="min-w-0 font-mono text-xs text-zinc-400 [overflow-wrap:anywhere]">UniqueVisitorCounter.java</span>
            <a
              href={visitorHashUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              View on GitHub
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-label="Source of UniqueVisitorCounter.visitorHash"
            className="overflow-x-auto py-4 font-mono text-[12.5px] leading-relaxed"
          >
            <code>
              {[
                { n: 58, text: "public static String visitorHash(final byte[] salt, final ClickRequest click, final long urlId) {" },
                { n: 59, text: '    final var visitor = StringUtils.defaultString(click.clientIp()) + "\\n" + StringUtils.defaultString(click.userAgent()) + "\\n" + urlId;' },
                { n: 60, text: "    final var hmac = hmacSha256(salt).doFinal(visitor.getBytes(StandardCharsets.UTF_8));", mark: true },
                { n: 61, text: "    return Base64.getUrlEncoder().withoutPadding().encodeToString(Arrays.copyOf(hmac, HASH_BYTES));" },
                { n: 62, text: "}" },
              ].map((line) => {
                const hangingIndent = `${line.text.length - line.text.trimStart().length + 4}ch`
                return (
                  <span
                    key={line.n}
                    className={cn("flex px-4", line.mark && "bg-brand/20 shadow-[inset_2px_0_0_hsl(var(--brand))]")}
                  >
                    <span className="mr-4 w-5 shrink-0 select-none text-right text-zinc-600">{line.n}</span>
                    <span
                      className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]"
                      style={{ paddingLeft: hangingIndent, textIndent: `-${hangingIndent}` }}
                    >
                      {line.text}
                    </span>
                  </span>
                )
              })}
            </code>
          </pre>
          <figcaption className="border-t border-zinc-800 px-4 py-3 text-xs leading-relaxed text-zinc-400">
            The <span className="text-zinc-200">salt</span> is 32 random bytes, made fresh each day and kept only in Redis until{" "}
            <a href={saltGraceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-zinc-200 underline decoration-zinc-600 underline-offset-4 hover:decoration-zinc-300">
              SALT_GRACE = Duration.ofHours(4)
            </a>{" "}
            after midnight.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

const curlExample = `curl -X POST https://hrva.cc/api/v1/urls \\
  -H "X-Api-Key: $HRVA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"longUrl": "https://example.com/a/very/long/path"}'`

function DevelopersSection() {
  const [copied, setCopied] = useState(false)

  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlExample)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id="developers" className="scroll-mt-16 py-24 sm:py-28">
      <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">Shorten from your own code</h2>
          <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Create an API key in your dashboard and send it in the <code className="whitespace-nowrap rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">X-Api-Key</code> header, or as a 
            <code className="whitespace-nowrap rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">Bearer</code> token.
            Links made over the API show up in your dashboard like any other.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/api-keys">Get an API key</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/developers">API quickstart</Link>
            </Button>
            <Button asChild variant="outline" className="gap-1.5">
              <a href="https://hrva.cc/swagger-ui/index.html" target="_blank" rel="noopener noreferrer">
                API reference
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Or let your AI assistant do it:{" "}
            <Link href="/mcp" className="font-medium text-brand hover:underline">
              connect hrva.cc/mcp
            </Link>
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.4)]">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <span className="text-xs font-medium text-zinc-400">Create a short link</span>
            <button
              type="button"
              onClick={copyCurl}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
            <code>
              <span className="text-zinc-500">$ </span>
              {curlExample}
            </code>
          </pre>
          <div className="border-t border-zinc-800 px-5 py-4 font-mono text-[13px] leading-relaxed text-zinc-400">
            <span className="text-zinc-500">{"// 200 OK"}</span>
            <br />
            {"{ "}<span className="text-sky-300">&quot;shortUrl&quot;</span>: <span className="text-emerald-300">&quot;k3Fx9&quot;</span>, <span className="text-sky-300">&quot;visits&quot;</span>: <span className="text-amber-200">0</span>, <span className="text-sky-300">&quot;active&quot;</span>: <span className="text-amber-200">true</span>{" }"}
          </div>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="border-t py-24 sm:py-28">
      <div className="container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-20">
        <div>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">Questions</h2>
        </div>
        <div className="divide-y border-y">
          {HOME_FAQS.map((faq) => (
            <details key={faq.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 [&::-webkit-details-marker]:hidden">
                <h3 className="font-medium">{faq.question}</h3>
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <div className="pb-5 pr-8 text-base leading-relaxed text-muted-foreground">
                <p>
                  {faq.answer.map((part, index) =>
                    typeof part === "string" ? <Fragment key={index}>{part}</Fragment> : <strong key={index}>{part.strong}</strong>,
                  )}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="pb-24 sm:pb-28">
      <div className="container">
        <div className="flex flex-col items-start gap-8 rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">Shorten a link</h2>
            <p className="mt-2 max-w-md text-primary-foreground/70">
              Sign up when you want aliases, limits and analytics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link href="/register">Create free account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="#shorten">Shorten a link</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function SignedInHome({ email }: { email: string }) {
  const { data: recentUrls } = useMyUrls()

  const latestUrls = recentUrls?.content?.slice(0, 6) ?? []

  useEffect(() => {
    const target = window.location.hash.slice(1)
    if (target) document.getElementById(target)?.scrollIntoView()
  }, [])

  return (
    <>
      <section className="container py-10 sm:py-14">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Shorten a link</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Signed in as {email}</p>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div id="shorten" className="scroll-mt-24 rounded-xl border bg-card p-5 sm:p-6">
            <ShortenForm withOptions />
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <h2 className="text-sm font-semibold">Recent links</h2>
              <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {latestUrls.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium">No links yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Your first short link will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {latestUrls.map((url) => (
                  <RecentLink key={url.id} shortUrl={url.shortUrl} hostname={url.domain?.hostname} longUrl={url.longUrl} visits={url.visits} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <FeatureGrid />
      <DevelopersSection />
    </>
  )
}

function RecentLink({ shortUrl, hostname, longUrl, visits }: { shortUrl: string; hostname?: string; longUrl: string; visits: number }) {
  const [copied, setCopied] = useState(false)
  const full = formatShortUrl(shortUrl, hostname)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <li className="group flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]"><span className="font-normal text-muted-foreground">{shortHostOf(hostname)}/</span>{shortUrl}</p>
        <p className="mt-0.5 break-all text-xs text-muted-foreground">{longUrl}</p>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{visits.toLocaleString()}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${full}`}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </li>
  )
}
