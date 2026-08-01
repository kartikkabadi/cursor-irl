# Cursor IRL

Cursor IRL is a live, low-friction find-me room for Cursor Roadshow Bangalore. People join with a name, X handle, and one line about what they are building. The app gives each person a deterministic cursor identity, a public profile, a QR link, and a share card.

- Live app: [kartikkabadi.com/cursor-irl](https://kartikkabadi.com/cursor-irl/)
- Source and issues: [github.com/kartikkabadi/cursor-irl](https://github.com/kartikkabadi/cursor-irl)
- License: [MIT](./LICENSE)

## What is included

- Live room with search and presence filters.
- Low-friction join flow centered on X identity.
- Deterministic Ditherprint cursor patterns generated from a server-issued profile ID and variant. No AI-generated avatars or seeded attendee rows.
- Public profile links with QR codes, “I met this person” connections, and presence controls.
- Downloadable 1200 × 630 share cards and pre-filled Post on X links. Browsers cannot attach a downloaded image to an X composer automatically, so image attachment is an intentional final step.
- Profile-specific Open Graph and Twitter metadata, with a Worker-served social preview image.

## Stack

Vite, React, TypeScript, Hono, Cloudflare Workers, Cloudflare D1, Tailwind CSS, Phosphor Icons, and `qrcode.react`.

## Local development

Prerequisites: Node.js and Wrangler. An authenticated Cloudflare account is only needed for deployment. This Codex workspace uses `sfw`; contributors on a normal checkout can use `npm install`.

Install and start the app in two terminals:

```bash
# In this workspace:
sfw npm install
# On a normal checkout:
npm install
npm run db:migrate:local
npm run dev:worker
```

```bash
npm run dev
```

Open the Vite URL printed by the second terminal. The Vite dev server proxies `/api` to the local Worker.

## Verification

Unit tests and type checks:

```bash
npm run typecheck
npm run test
npm run build:path
```

The API integration suite needs its own isolated Wrangler Worker and D1 state. Run these commands in separate terminals:

```bash
npm run db:migrate:integration
npm run dev:worker:integration
```

Then run:

```bash
npm run test:integration
```

The integration suite creates temporary QA rows in `.wrangler/integration` and deletes them during teardown. It does not use the production database.

## Deployment

Production is mounted at `/cursor-irl/` on `kartikkabadi.com`. The Worker uses the `cursor-irl` D1 database and the checked-in migrations. Do not add seed data to the remote database.

After authenticating Wrangler, apply new migrations when needed and deploy:

```bash
npm run db:migrate:remote
npm run deploy
```

`npm run deploy` builds both the mounted `/cursor-irl/` asset tree and the path-aware SPA fallback before uploading the Worker and assets.

## Pull requests

Pull requests to `main` should include typecheck, unit tests, integration tests, the path build, desktop/mobile browser QA, and production route verification when the change affects deployment. Do not commit `.env`, `.dev.vars`, Wrangler state, screenshots, or production credentials.
