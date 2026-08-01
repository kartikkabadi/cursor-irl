# Cursor IRL

**Turn handles into handshakes.**

Live event app for Cursor Roadshow Bangalore. Attendees declare who they are, get a unique animated cursor identity + QR, and log IRL meetings by scanning each other.

## Stack

- React + Vite + TypeScript + Tailwind CSS
- Cloudflare Workers (Hono API)
- Cloudflare D1
- Browser QR codes (`qrcode`)
- Local edit tokens (hashed in D1, raw token in `localStorage`)

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Live room, search, filters, leaderboard |
| `/join` | Create profile + cursor identity |
| `/p/:slug` | Public profile, QR, Post on X, I met them |
| `/me` | Edit, Find-me card, leave, delete, connections |

## Local development

```bash
npm install
npx wrangler d1 migrations apply cursor-irl --local
npm run dev
```

Open the printed Vite URL (usually `http://localhost:5173`).

The Cloudflare Vite plugin runs the Worker + D1 locally. Seed data loads eight Bangalore roadshow attendees.

### Useful scripts

```bash
npm run build              # typecheck + production build
npm run preview            # build then preview on Workers runtime
npm run db:migrate:local   # apply D1 migrations locally
npm run db:migrate:remote  # apply D1 migrations to production DB
npm run deploy             # build + wrangler deploy
```

## Cloudflare deploy

1. Create a D1 database:

```bash
npx wrangler d1 create cursor-irl
```

2. Paste the returned `database_id` into `wrangler.jsonc` (replace `local-cursor-irl-dev`).

3. Apply migrations remotely:

```bash
npm run db:migrate:remote
```

4. Deploy:

```bash
npm run deploy
```

Workers + static assets ship together. Free-tier friendly for a single-event disposable deploy.

## Product rules (kept intentionally small)

- Heartbeat every 60s while your session is active on this device
- “Here now” = last heartbeat &lt; 10 minutes
- No GPS, chat, OAuth, or X scraping
- “I left” pauses heartbeats and drops you from Here now
- “I met this person” creates a deduped undirected connection

## Threat model (accepted for a disposable event room)

- Anyone can create a profile (no signup)
- Edit/delete requires the device-local edit token
- “I met this person” is one-sided by design
- Set `KEEP_SEEDS_ACTIVE` to `"false"` (or remove) in production if you do not want demo seed attendees marked live

## Design

Visual tokens live in [`DESIGN.md`](./DESIGN.md), extracted from cursor.com (cream canvas, ink, orange accent, pill CTAs).
