# Cursor IRL

Live room for the Cursor Roadshow Bangalore. Turn handles into handshakes.

- Live app: https://kartikkabadi.com/cursor-irl/
- Source: https://github.com/kartikkabadi/cursor-irl
- Stack: Vite + React + TypeScript, Hono on Cloudflare Workers, Cloudflare D1
- Identity: deterministic Ditherprint patterns; no AI-generated avatars and no seed attendees

## Development

```bash
sfw npm install
npm run db:migrate:local
npm run dev:worker
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm run test
npm run test:integration
npm run build:path
```

## Deployment

The production app is mounted at `/cursor-irl/` on `kartikkabadi.com`. The Worker uses the `cursor-irl` D1 database and the checked-in migrations. Keep the remote database empty of synthetic attendees; integration tests create and delete their own temporary rows.

```bash
npm run db:migrate:remote
npm run deploy
```

Pull requests to `main` should pass typecheck, unit tests, integration tests, and the path build before merge. Do not commit `.env`, `.dev.vars`, Wrangler state, or production credentials.
