import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Attendee, AttendeeConnection, AvatarMode, CreateAttendeeInput, LeaderboardEntry, VenueZone } from '../shared/attendee';
import { randomId, randomToken, hashToken } from './crypto';
import { connectionSchema, createAttendeeSchema, updateAttendeeSchema } from './schema';
import { DITHERPRINT_EVENT_ID, generateDitherprintCandidates, generateDitherprintIdentity } from '../shared/ditherprint';
import { fetchCursorTokens } from './cursor-profile';

type Env = {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
    EVENT_NAME: string;
    BASE_PATH?: string;
  };
};

type AttendeeRow = {
  id: string;
  slug: string;
  name: string;
  x_handle: string | null;
  cursor_handle: string | null;
  github_handle: string | null;
  avatar_mode: string;
  avatar_variant: number;
  avatar_algorithm_version: string;
  avatar_image_ref: string | null;
  avatar_url: string | null;
  project: string;
  looking_for: string | null;
  outfit_clue: string | null;
  venue_zone: VenueZone | null;
  open_to_meet: number;
  cursor_color: string;
  cursor_code: string;
  last_seen_at: number;
  created_at: number;
  connection_count: number;
};

const app = new Hono<Env>();

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function publicAttendee(row: AttendeeRow): Attendee {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    x_handle: normalizeHandle(row.x_handle ?? undefined),
    cursor_handle: normalizeHandle(row.cursor_handle ?? undefined),
    github_handle: normalizeHandle(row.github_handle ?? undefined),
    avatar_mode: row.avatar_mode as AvatarMode,
    avatar_variant: Number(row.avatar_variant),
    avatar_algorithm_version: row.avatar_algorithm_version,
    avatar_image_ref: row.avatar_image_ref,
    avatar_url: row.avatar_url,
    project: row.project,
    looking_for: row.looking_for,
    outfit_clue: row.outfit_clue,
    venue_zone: row.venue_zone,
    open_to_meet: Boolean(row.open_to_meet),
    cursor_color: row.cursor_color,
    cursor_code: row.cursor_code,
    created_at: row.created_at,
    connection_count: Number(row.connection_count ?? 0),
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Try again.';
}

function jsonError(c: Context<Env>, status: 400 | 401 | 404 | 409 | 422 | 500, message: string, details?: unknown) {
  return c.json({ error: message, details }, status);
}

function normalizeHandle(value?: string): string | null {
  const normalized = value?.trim().replace(/^@+/, '');
  if (!normalized) return null;
  const urlValue = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  try {
    const url = new URL(urlValue);
    const host = url.hostname.toLowerCase();
    if (['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'cursor.com', 'www.cursor.com', 'github.com', 'www.github.com'].includes(host)) {
      return url.pathname.split('/').filter(Boolean)[0]?.replace(/^@+/, '') || null;
    }
  } catch { /* keep a plain handle below */ }
  return normalized.split(/[/?#]/, 1)[0] || null;
}

function slugify(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'cursor';
}

async function uniqueSlug(db: D1Database, name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? '' : `-${Math.floor(100 + Math.random() * 900)}`;
    const slug = `${base}${suffix}`;
    const existing = await db.prepare('SELECT id FROM attendees WHERE slug = ?1').bind(slug).first();
    if (!existing) return slug;
  }
  throw new Error('Could not generate a unique profile link.');
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) return authorization.slice(7).trim();
  return request.headers.get('x-edit-token');
}

async function ownedAttendee(db: D1Database, id: string, request: Request): Promise<AttendeeRow | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await hashToken(token);
  return await db.prepare(`
    SELECT a.*, (
      SELECT COUNT(*) FROM connections c WHERE c.attendee_a = a.id OR c.attendee_b = a.id
    ) AS connection_count
    FROM attendees a WHERE a.id = ?1 AND a.edit_token_hash = ?2
  `).bind(id, tokenHash).first<AttendeeRow>();
}

function readableValidation(error: { issues: Array<{ path: (string | number)[]; message: string }> }): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]));
}

async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const CONNECTION_COUNT_SQL = `(
  SELECT COUNT(*) FROM connections c WHERE c.attendee_a = a.id OR c.attendee_b = a.id
) AS connection_count`;

function attendeeSelect(extraWhere = '', orderBy = 'a.created_at DESC') {
  return `
    SELECT a.*, ${CONNECTION_COUNT_SQL}
    FROM attendees a
    WHERE 1 = 1 ${extraWhere}
    ORDER BY ${orderBy}
  `;
}

app.get('/api/health', (c) => c.json({ ok: true, service: 'cursor-irl', event: c.env.EVENT_NAME }));

app.post('/api/identity-preview', async (c) => {
  const profileId = randomId();
  const candidates = await generateDitherprintCandidates(profileId, DITHERPRINT_EVENT_ID);
  return c.json({
    profile_id: profileId,
    algorithm_version: candidates[0].algorithm_version,
    candidates,
  });
});

app.get('/api/cursor/:handle', async (c) => {
  const handle = normalizeHandle(c.req.param('handle'));
  if (!handle || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,49}$/.test(handle)) return jsonError(c, 422, 'That Cursor handle is not valid.');
  const tokens = await fetchCursorTokens(handle);
  return c.json({ handle, profile_url: `https://cursor.com/@${handle}`, tokens, available: tokens !== null }, 200, {
    'cache-control': 'public, max-age=300',
  });
});

app.get('/api/attendees', async (c) => {
  const query = c.req.query('q')?.trim() ?? '';
  const filter = c.req.query('filter') ?? 'all';
  const params: string[] = [];
  const clauses: string[] = [];

  if (query) {
    params.push(`%${query.toLowerCase()}%`);
    clauses.push(`LOWER(COALESCE(a.name, '') || ' ' || COALESCE(a.x_handle, '') || ' ' || COALESCE(a.cursor_handle, '') || ' ' || COALESCE(a.github_handle, '') || ' ' || COALESCE(a.project, '') || ' ' || COALESCE(a.looking_for, '') || ' ' || COALESCE(a.outfit_clue, '') || ' ' || COALESCE(a.venue_zone, '')) LIKE ?${params.length}`);
  }
  if (filter === 'open') clauses.push('a.open_to_meet = 1');
  if (filter === 'agents') clauses.push(`LOWER(COALESCE(a.project, '') || ' ' || COALESCE(a.looking_for, '')) LIKE '%agent%'`);
  if (filter === 'collab') clauses.push(`LOWER(COALESCE(a.looking_for, '')) LIKE '%collab%'`);

  const querySql = attendeeSelect(clauses.length ? ` AND ${clauses.join(' AND ')}` : '', 'connection_count DESC, a.created_at DESC');
  const result = await c.env.DB.prepare(querySql).bind(...params).all<AttendeeRow>();
  return c.json({ attendees: (result.results ?? []).map(publicAttendee) });
});

app.get('/api/leaderboard', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT a.id, a.slug, a.name, a.cursor_color, a.cursor_code, a.avatar_variant, a.avatar_algorithm_version,
      ${CONNECTION_COUNT_SQL}
    FROM attendees a
    ORDER BY connection_count DESC, a.created_at ASC
    LIMIT 5
  `).all<LeaderboardEntry>();
  return c.json({ leaderboard: result.results ?? [] });
});

app.get('/api/attendees/:slug', async (c) => {
  const row = await c.env.DB.prepare(attendeeSelect(' AND (a.slug = ?1 OR a.id = ?1)')).bind(c.req.param('slug')).first<AttendeeRow>();
  if (!row) return jsonError(c, 404, 'That cursor is not in the room.');

  const connections = await c.env.DB.prepare(`
    SELECT a.id, a.slug, a.name, a.cursor_color, a.cursor_code, a.avatar_variant, a.avatar_algorithm_version, c.created_at
    FROM connections c
    JOIN attendees a ON a.id = CASE WHEN c.attendee_a = ?1 THEN c.attendee_b ELSE c.attendee_a END
    WHERE c.attendee_a = ?1 OR c.attendee_b = ?1
    ORDER BY c.created_at DESC
  `).bind(row.id).all<AttendeeConnection>();

  return c.json({ attendee: { ...publicAttendee(row), connections: connections.results ?? [] } });
});

app.post('/api/attendees', async (c) => {
  const parsed = createAttendeeSchema.safeParse(await parseJson(c.req.raw));
  if (!parsed.success) return jsonError(c, 422, 'Check the highlighted fields.', readableValidation(parsed.error));

  const input = parsed.data as CreateAttendeeInput;
  const id = input.profile_id;
  const slug = await uniqueSlug(c.env.DB, input.name);
  const identity = await generateDitherprintIdentity(id, input.variant, DITHERPRINT_EVENT_ID);
  const editToken = randomToken();
  const timestamp = now();
  const avatarMode = input.avatar_mode ?? 'ditherprint';

  const insert = await c.env.DB.prepare(`
    INSERT INTO attendees (
      id, slug, name, x_handle, cursor_handle, github_handle, avatar_mode, avatar_variant, avatar_algorithm_version,
      avatar_image_ref, avatar_url, project, looking_for, outfit_clue, venue_zone, open_to_meet,
      cursor_color, cursor_code, edit_token_hash, last_seen_at, created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
  `).bind(
    id, slug, input.name.trim(), normalizeHandle(input.x_handle), normalizeHandle(input.cursor_handle), normalizeHandle(input.github_handle),
    avatarMode, identity.variant, identity.algorithm_version, null,
    input.avatar_url || null, input.project.trim(), input.looking_for?.trim() || null,
    input.outfit_clue?.trim() || null, input.venue_zone ?? null, input.open_to_meet ? 1 : 0,
    identity.cursor_color, identity.fingerprint, await hashToken(editToken), timestamp, timestamp,
  ).run();

  if (!insert.success) {
    const message = errorMessage(insert.error);
    const reused = message.includes('UNIQUE constraint') || message.includes('PRIMARY KEY');
    return jsonError(c, reused ? 409 : 500, reused ? 'That identity draft was already used. Start again for a fresh one.' : 'Your profile could not be created.');
  }

  const row = await c.env.DB.prepare(attendeeSelect(' AND a.id = ?1')).bind(id).first<AttendeeRow>();
  if (!row) return jsonError(c, 500, 'Your profile was created but could not be read back.');
  return c.json({ attendee: publicAttendee(row), edit_token: editToken }, 201);
});

app.patch('/api/attendees/:id', async (c) => {
  const id = c.req.param('id');
  const owner = await ownedAttendee(c.env.DB, id, c.req.raw);
  if (!owner) return jsonError(c, 401, 'That edit link is not valid anymore.');
  const parsed = updateAttendeeSchema.safeParse(await parseJson(c.req.raw));
  if (!parsed.success) return jsonError(c, 422, 'Check the highlighted fields.', readableValidation(parsed.error));

  const input = parsed.data;
  const updates: string[] = [];
  const values: Array<string | number | null> = [];
  const fields: Array<[keyof typeof input, string, (value: unknown) => string | number | null]> = [
    ['name', 'name', (value) => String(value).trim()],
    ['x_handle', 'x_handle', (value) => normalizeHandle(String(value))],
    ['cursor_handle', 'cursor_handle', (value) => normalizeHandle(String(value))],
    ['github_handle', 'github_handle', (value) => normalizeHandle(String(value))],
    ['avatar_mode', 'avatar_mode', (value) => String(value)],
    ['avatar_url', 'avatar_url', (value) => String(value).trim() || null],
    ['project', 'project', (value) => String(value).trim()],
    ['looking_for', 'looking_for', (value) => String(value).trim() || null],
    ['outfit_clue', 'outfit_clue', (value) => String(value).trim() || null],
    ['venue_zone', 'venue_zone', (value) => String(value)],
    ['open_to_meet', 'open_to_meet', (value) => value ? 1 : 0],
  ];
  for (const [inputKey, column, transform] of fields) {
    if (inputKey in input && input[inputKey] !== undefined) {
      updates.push(`${column} = ?${values.length + 1}`);
      values.push(transform(input[inputKey]));
    }
  }

  const variantChanged = input.variant !== undefined && input.variant !== owner.avatar_variant;
  if (variantChanged) {
    const identity = await generateDitherprintIdentity(owner.id, input.variant as number, DITHERPRINT_EVENT_ID);
    updates.push(`avatar_variant = ?${values.length + 1}`, `avatar_algorithm_version = ?${values.length + 2}`, `cursor_color = ?${values.length + 3}`, `cursor_code = ?${values.length + 4}`);
    values.push(identity.variant, identity.algorithm_version, identity.cursor_color, identity.fingerprint);
  }

  if (updates.length) {
    values.push(id);
    const result = await c.env.DB.prepare(`UPDATE attendees SET ${updates.join(', ')} WHERE id = ?${values.length}`).bind(...values).run();
    if (!result.success) return jsonError(c, 409, 'That identity was already taken. Pick another option.');
  }
  const row = await c.env.DB.prepare(attendeeSelect(' AND a.id = ?1')).bind(id).first<AttendeeRow>();
  if (!row) return jsonError(c, 404, 'That cursor left the room.');
  return c.json({ attendee: publicAttendee(row) });
});

app.post('/api/attendees/:id/connections', async (c) => {
  const sourceId = c.req.param('id');
  const owner = await ownedAttendee(c.env.DB, sourceId, c.req.raw);
  if (!owner) return jsonError(c, 401, 'Join the room to record an IRL connection.');
  const parsed = connectionSchema.safeParse(await parseJson(c.req.raw));
  if (!parsed.success) return jsonError(c, 422, 'That profile is not valid.');
  if (sourceId === parsed.data.target_id) return jsonError(c, 400, 'Your own cursor is already with you.');

  const target = await c.env.DB.prepare('SELECT id FROM attendees WHERE id = ?1').bind(parsed.data.target_id).first<{ id: string }>();
  if (!target) return jsonError(c, 404, 'That cursor is not in the room.');
  const [attendeeA, attendeeB] = [sourceId, target.id].sort();
  const result = await c.env.DB.prepare(`
    INSERT OR IGNORE INTO connections (id, attendee_a, attendee_b, created_at) VALUES (?1, ?2, ?3, ?4)
  `).bind(randomId(), attendeeA, attendeeB, now()).run();
  const row = await c.env.DB.prepare(attendeeSelect(' AND a.id = ?1')).bind(sourceId).first<AttendeeRow>();
  return c.json({ created: Boolean(result.meta?.changes), attendee: row ? publicAttendee(row) : null });
});

app.delete('/api/attendees/:id', async (c) => {
  const id = c.req.param('id');
  const owner = await ownedAttendee(c.env.DB, id, c.req.raw);
  if (!owner) return jsonError(c, 401, 'That edit link is not valid anymore.');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM connections WHERE attendee_a = ?1 OR attendee_b = ?1').bind(id),
    c.env.DB.prepare('DELETE FROM attendees WHERE id = ?1').bind(id),
  ]);
  return c.json({ deleted: true });
});

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function socialPreviewImage(c: Context<Env>) {
  const assetUrl = new URL('/cursor-irl-og.png', c.req.url);
  const asset = await c.env.ASSETS.fetch(new Request(assetUrl));
  if (!asset.ok) return new Response('Preview image unavailable.', { status: 503 });
  const headers = new Headers(asset.headers);
  headers.set('content-type', 'image/png');
  headers.set('cache-control', 'public, max-age=3600');
  return new Response(asset.body, { status: 200, headers });
}

app.get('/og.png', socialPreviewImage);

async function profilePage(c: Context<Env>) {
  const row = await c.env.DB.prepare('SELECT * FROM attendees WHERE slug = ?1').bind(c.req.param('slug')).first<AttendeeRow>();
  const shell = await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url), c.req.raw));
  if (!row || !shell.ok) return shell;
  const basePath = c.env.BASE_PATH ?? '/';
  const profileUrl = new URL(`${basePath.replace(/\/$/, '')}/p/${row.slug}`, c.req.url).toString();
  const imageUrl = new URL(`${basePath.replace(/\/$/, '')}/og.png`, c.req.url).toString();
  const title = `${row.name} · Cursor IRL`;
  const description = row.project ? `Building: ${row.project}. Find ${row.name} at Cursor Roadshow Bangalore.` : `Find ${row.name} at Cursor Roadshow Bangalore.`;
  const meta = [
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="Cursor IRL" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(profileUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
    `<meta name="twitter:image:alt" content="Cursor IRL card for ${escapeHtml(row.name)}" />`,
    `<link rel="canonical" href="${escapeHtml(profileUrl)}" />`,
  ].join('');
  const html = (await shell.text())
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/\s*<meta property="og:[^>]+\/>/g, '')
    .replace(/\s*<meta name="twitter:[^>]+\/>/g, '')
    .replace('</head>', `${meta}</head>`);
  const headers = new Headers(shell.headers);
  headers.delete('content-length');
  return new Response(html, { status: shell.status, headers });
}

app.get('/p/:slug', profilePage);
app.get('/p/:slug/', profilePage);

app.all('*', async (c) => {
  // Keep unknown API paths JSON instead of letting the SPA fallback return
  // misleading HTML with a 200 status.
  if (c.req.path === '/api' || c.req.path.startsWith('/api/')) return jsonError(c, 404, 'API route not found.');
  return c.env.ASSETS.fetch(c.req.raw);
});

app.onError((error, c) => {
  console.error(errorMessage(error));
  return jsonError(c, 500, 'The room hit a snag. Try again in a moment.');
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const basePath = (env as unknown as Env['Bindings']).BASE_PATH;
    if (basePath) {
      const url = new URL(request.url);
      const baseWithoutSlash = basePath.replace(/\/$/, '');
      if (url.pathname === baseWithoutSlash) {
        return Response.redirect(`${url.origin}${basePath}${url.search}`, 301);
      }
      if (url.pathname.startsWith(basePath)) {
        const stripped = url.pathname.slice(basePath.length) || '/';
        const rewritten = new URL(stripped, url.origin);
        rewritten.search = url.search;
        request = new Request(rewritten, request);
      }
    }
    return app.fetch(request, env, ctx);
  },
};
