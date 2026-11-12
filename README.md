# [hrva.cc — URL Shortener Frontend](https://app.hrva.cc)

## Overview
This repository is the web app at [app.hrva.cc](https://app.hrva.cc), the site for hrva.cc, a privacy-first URL shortener with built-in link safety. You make and manage short links, run a bio page, read your link stats and manage your account here. Admins moderate the site from here too. The API lives in the backend repository, [HrvaLabs/url-shortener](https://github.com/HrvaLabs/url-shortener).

## Features
The labels below are the ones in the site header and footer.

### Links
- Shorten links from the home page or the dashboard, with a custom alias if you want one.
- Expiry dates, visit limits, password protection and tags.
- Bulk creation through the API (`POST /api/v1/urls/bulk`). The web app has no bulk form.
- A campaign tracking (UTM) builder next to the link field.
- QR codes you can style and download as PNG or SVG. Their scans count as QR scans in the link's stats.
- API keys for making links from your own code, under **API keys** in the dashboard. Expired and revoked keys can be deleted.

### Bio pages
- One page at `hrva.cc/@yourname`, with a button for each of your short links, edited under **Bio page** in the dashboard.
- **Bio pages** in the header explains how they work.

### Privacy-first analytics
- Per-link stats and an overview: clicks, daily unique visitors, referrers, devices, browsers, countries, and QR scans against other clicks.
- The bio page view shows your page's views and the clicks on each button.
- Everything is a daily total. Nothing identifies a visitor.

### Accounts
- Sign in with email and password, Google, or a passkey or security key.
- Two-step verification with an authenticator app or a passkey, plus recovery codes.
- Export your data and delete your account in Settings.

### Public pages
- **Public stats** (`/stats`): site-wide numbers, such as active links, clicks and harmful links blocked.
- **Help** (`/help`): guides for campaign tracking, passkeys, bio pages and the stats.
- **Report abuse** (`/report`): report a short link or a bio page.
- **Check a link** (`/validate`): look up where a short link goes before you open it.
- **AI connector (MCP)** (`/mcp`): how to connect Claude, ChatGPT, Cursor or VS Code to hrva.cc.
- The blog, the changelog, and the privacy and terms pages.

### Admin
- Stats, health, the review queue, blocklists, reserved aliases, all links, users, bio pages, all API keys, the audit log and the email log.

### Look
- Light and dark theme. It follows your system and has a toggle in the header.

## Tech
- **Next.js 16** (App Router) and **React 19**
- **TanStack Query** for server data
- **Tailwind CSS 4**, with shadcn-style components on Radix
- **Cloudflare Workers**, through OpenNext (`@opennextjs/cloudflare`)

## Getting started
1. Install **Node 22.18 or newer**.
2. Install the dependencies with `npm ci`.
3. Run the backend. Its [README](https://github.com/HrvaLabs/url-shortener#running-it) has the short version, with Postgres and Redis in Docker and the `local` profile on port 8080.
4. Start the app with `npm run dev` and open [localhost:3000](http://localhost:3000). It sends `/api/v1` and the sign-in paths to `http://localhost:8080`. To use a backend on another port, set `DEV_API_ORIGIN`, for example `DEV_API_ORIGIN=http://localhost:18082 npm run dev -- -p 3002`. See [AGENTS.md](./AGENTS.md) → Commands.
5. Sign in with a local dev user. They come from the backend's `local` profile: `admin@localhost` / `admin123` and `user@localhost` / `user123`.

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Starts the Next.js dev server |
| `npm run build` | Builds the app with Next.js. Every change runs it, along with `npx tsc --noEmit` and `npm run lint` |
| `npm run lint` | Runs ESLint over the repository |
| `npm run check:bio` | Checks that no invisible characters slipped into the source, then checks the bio page text rules |
| `npm run deploy` | Builds the Cloudflare Worker with OpenNext and deploys it |

## Deployment
The production Cloudflare Worker `url-shortener` is connected to the
[HrvaLabs/URL-Shortener-FE](https://github.com/HrvaLabs/URL-Shortener-FE)
repository. Pushing to `main` triggers Workers Builds, using `npm run build`
and `npm run deploy`. Other branches are not built on Cloudflare; CI builds
the Worker bundle with `npm run build:cf` on every pull request.

## More
- [AGENTS.md](./AGENTS.md) covers the architecture, commands, pages and gotchas.
- [DESIGN.md](./DESIGN.md) holds the design rules.
- The changelog lives in the backend repository and shows at [app.hrva.cc/changelog](https://app.hrva.cc/changelog).
