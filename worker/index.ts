import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import {
  ACTIVE_MS,
  CURSOR_COLORS,
  joinSchema,
  meetSchema,
  normalizeHandle,
  presenceSchema,
  slugify,
  toPublic,
  updateSchema,
  type AttendeeRow,
  type PublicAttendee,
} from "./lib/schema";
import {
  pairKey,
  randomCursorCode,
  randomEditToken,
  randomId,
  sha256Hex,
} from "./lib/crypto";

type Bindings = {
  DB: D1Database;
};

type Variables = {
  origin: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("/api/*", cors());

app.use("/api/*", async (c, next) => {
  const url = new URL(c.req.url);
  c.set("origin", url.origin);
  await next();
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || "Internal error" }, 500);
});

app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.text("Not found", 404);
});

async function getConnectionCounts(
  db: D1Database,
  ids: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  for (const id of ids) map.set(id, 0);

  const placeholders = ids.map(() => "?").join(",");
  const { results } = await db
    .prepare(
      `SELECT attendee_a AS id, COUNT(*) AS c FROM connections
       WHERE attendee_a IN (${placeholders})
       GROUP BY attendee_a
       UNION ALL
       SELECT attendee_b AS id, COUNT(*) AS c FROM connections
       WHERE attendee_b IN (${placeholders})
       GROUP BY attendee_b`,
    )
    .bind(...ids, ...ids)
    .all<{ id: string; c: number }>();

  for (const row of results ?? []) {
    map.set(row.id, (map.get(row.id) ?? 0) + Number(row.c));
  }
  return map;
}

async function getAttendeeBySlug(
  db: D1Database,
  slug: string,
): Promise<AttendeeRow | null> {
  return db
    .prepare("SELECT * FROM attendees WHERE slug = ?")
    .bind(slug)
    .first<AttendeeRow>();
}

async function getAttendeeById(
  db: D1Database,
  id: string,
): Promise<AttendeeRow | null> {
  return db
    .prepare("SELECT * FROM attendees WHERE id = ?")
    .bind(id)
    .first<AttendeeRow>();
}

async function assertEditToken(
  row: AttendeeRow,
  editToken: string,
): Promise<boolean> {
  const hash = await sha256Hex(editToken);
  return hash === row.edit_token_hash;
}

async function uniqueSlug(db: D1Database, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const existing = await getAttendeeBySlug(db, candidate);
    if (!existing) return candidate;
    candidate = `${base}-${Math.floor(Math.random() * 90 + 10)}`;
  }
  return `${base}-${randomId().slice(0, 6)}`;
}

async function uniqueCursorCode(db: D1Database): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const code = randomCursorCode();
    const hit = await db
      .prepare("SELECT id FROM attendees WHERE cursor_code = ?")
      .bind(code)
      .first();
    if (!hit) return code;
  }
  return randomCursorCode() + randomCursorCode().slice(0, 1);
}

async function refreshSeedPresence(db: D1Database): Promise<void> {
  // Keep demo seed attendees visible in local/dev rooms.
  await db
    .prepare(`UPDATE attendees SET last_seen_at = ? WHERE id LIKE 'seed_%'`)
    .bind(Date.now())
    .run();
}

function matchesFilter(
  person: PublicAttendee,
  q: string,
  filter: string | undefined,
): boolean {
  if (filter === "here") {
    if (!person.isActive) return false;
  } else if (filter === "open") {
    if (!person.openToMeet || !person.isActive) return false;
  } else if (filter === "agents") {
    const hay = `${person.project} ${person.lookingFor ?? ""}`.toLowerCase();
    if (!/(agent|agents|autonomous|cursor)/.test(hay)) return false;
  } else if (filter === "collab") {
    const hay = `${person.lookingFor ?? ""} ${person.project}`.toLowerCase();
    if (!/(collaborat|collab|co-?found|partner|jam|meet)/.test(hay)) return false;
  }

  if (!q) return true;
  const hay = [
    person.name,
    person.xHandle,
    person.githubHandle,
    person.project,
    person.lookingFor,
    person.venueZone,
    person.cursorCode,
    person.outfitClue,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

app.get("/api/health", (c) => c.json({ ok: true, name: "cursor-irl" }));

app.get("/api/attendees", async (c) => {
  await refreshSeedPresence(c.env.DB);
  const q = (c.req.query("q") ?? "").trim().toLowerCase();
  const filter = c.req.query("filter") ?? undefined;
  const includeInactive = c.req.query("all") === "1";

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM attendees ORDER BY last_seen_at DESC",
  ).all<AttendeeRow>();

  const rows = results ?? [];
  const counts = await getConnectionCounts(
    c.env.DB,
    rows.map((r) => r.id),
  );
  const now = Date.now();

  let people = rows.map((row) =>
    toPublic(row, counts.get(row.id) ?? 0, now),
  );

  if (!includeInactive) {
    people = people.filter((p) => p.isActive);
  }

  people = people.filter((p) => matchesFilter(p, q, filter));

  return c.json({ attendees: people, activeWindowMs: ACTIVE_MS });
});

app.get("/api/leaderboard", async (c) => {
  await refreshSeedPresence(c.env.DB);
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM attendees",
  ).all<AttendeeRow>();
  const rows = results ?? [];
  const counts = await getConnectionCounts(
    c.env.DB,
    rows.map((r) => r.id),
  );
  const now = Date.now();
  const ranked = rows
    .map((row) => toPublic(row, counts.get(row.id) ?? 0, now))
    .filter((p) => p.connectionCount > 0 || p.isActive)
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 8);

  return c.json({ leaders: ranked });
});

app.get("/api/attendees/:slug", async (c) => {
  await refreshSeedPresence(c.env.DB);
  const slug = c.req.param("slug");
  const row = await getAttendeeBySlug(c.env.DB, slug);
  if (!row) return c.json({ error: "Profile not found" }, 404);

  const counts = await getConnectionCounts(c.env.DB, [row.id]);
  const person = toPublic(row, counts.get(row.id) ?? 0);

  const { results: connRows } = await c.env.DB.prepare(
    `SELECT CASE WHEN attendee_a = ? THEN attendee_b ELSE attendee_a END AS other_id
     FROM connections WHERE attendee_a = ? OR attendee_b = ?`,
  )
    .bind(row.id, row.id, row.id)
    .all<{ other_id: string }>();

  const otherIds = (connRows ?? []).map((r) => r.other_id);
  let connections: PublicAttendee[] = [];
  if (otherIds.length) {
    const placeholders = otherIds.map(() => "?").join(",");
    const { results: others } = await c.env.DB.prepare(
      `SELECT * FROM attendees WHERE id IN (${placeholders})`,
    )
      .bind(...otherIds)
      .all<AttendeeRow>();
    const otherCounts = await getConnectionCounts(c.env.DB, otherIds);
    connections = (others ?? []).map((o) =>
      toPublic(o, otherCounts.get(o.id) ?? 0),
    );
  }

  const origin = c.get("origin");
  const profileUrl = `${origin}/p/${person.slug}`;
  const tweetText = [
    `I’m the ${person.colorName} ${person.cursorCode} cursor at Cursor Roadshow Bangalore.`,
    "",
    `Building: ${person.project}`,
    `Find me: ${[person.venueZone, person.outfitClue].filter(Boolean).join(" / ")}`,
    "",
    `Come say hi: ${profileUrl}`,
  ].join("\n");

  return c.json({
    attendee: person,
    connections,
    profileUrl,
    tweetIntentUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
  });
});

app.post("/api/attendees", zValidator("json", joinSchema), async (c) => {
  const body = c.req.valid("json");
  const now = Date.now();
  const id = randomId("att");
  const slug = await uniqueSlug(c.env.DB, body.name);
  const cursorCode = await uniqueCursorCode(c.env.DB);
  const cursorColor =
    CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]!;
  const editToken = randomEditToken();
  const editTokenHash = await sha256Hex(editToken);

  await c.env.DB.prepare(
    `INSERT INTO attendees (
      id, slug, name, x_handle, github_handle, avatar_url, project, looking_for,
      outfit_clue, venue_zone, open_to_meet, cursor_color, cursor_code,
      edit_token_hash, last_seen_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      body.name.trim(),
      normalizeHandle(body.xHandle),
      normalizeHandle(body.githubHandle),
      body.avatarUrl?.trim() || null,
      body.project.trim(),
      body.lookingFor?.trim() || null,
      body.outfitClue?.trim() || null,
      body.venueZone,
      body.openToMeet ? 1 : 0,
      cursorColor,
      cursorCode,
      editTokenHash,
      now,
      now,
    )
    .run();

  const row = await getAttendeeById(c.env.DB, id);
  if (!row) return c.json({ error: "Failed to create profile" }, 500);

  return c.json(
    {
      attendee: toPublic(row, 0, now),
      editToken,
    },
    201,
  );
});

app.patch(
  "/api/attendees/:slug",
  zValidator("json", updateSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const body = c.req.valid("json");
    const row = await getAttendeeBySlug(c.env.DB, slug);
    if (!row) return c.json({ error: "Profile not found" }, 404);
    if (!(await assertEditToken(row, body.editToken))) {
      return c.json({ error: "Invalid edit token" }, 403);
    }

    const next = {
      name: body.name?.trim() ?? row.name,
      x_handle:
        body.xHandle !== undefined
          ? normalizeHandle(body.xHandle)
          : row.x_handle,
      github_handle:
        body.githubHandle !== undefined
          ? normalizeHandle(body.githubHandle)
          : row.github_handle,
      avatar_url:
        body.avatarUrl !== undefined
          ? body.avatarUrl.trim() || null
          : row.avatar_url,
      project: body.project?.trim() ?? row.project,
      looking_for:
        body.lookingFor !== undefined
          ? body.lookingFor.trim() || null
          : row.looking_for,
      outfit_clue:
        body.outfitClue !== undefined
          ? body.outfitClue.trim() || null
          : row.outfit_clue,
      venue_zone: body.venueZone ?? row.venue_zone,
      open_to_meet:
        body.openToMeet !== undefined
          ? body.openToMeet
            ? 1
            : 0
          : row.open_to_meet,
    };

    await c.env.DB.prepare(
      `UPDATE attendees SET
        name = ?, x_handle = ?, github_handle = ?, avatar_url = ?, project = ?,
        looking_for = ?, outfit_clue = ?, venue_zone = ?, open_to_meet = ?,
        last_seen_at = ?
       WHERE id = ?`,
    )
      .bind(
        next.name,
        next.x_handle,
        next.github_handle,
        next.avatar_url,
        next.project,
        next.looking_for,
        next.outfit_clue,
        next.venue_zone,
        next.open_to_meet,
        Date.now(),
        row.id,
      )
      .run();

    const updated = await getAttendeeById(c.env.DB, row.id);
    const counts = await getConnectionCounts(c.env.DB, [row.id]);
    return c.json({
      attendee: toPublic(updated!, counts.get(row.id) ?? 0),
    });
  },
);

app.post(
  "/api/attendees/:slug/heartbeat",
  zValidator("json", presenceSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const { editToken } = c.req.valid("json");
    const row = await getAttendeeBySlug(c.env.DB, slug);
    if (!row) return c.json({ error: "Profile not found" }, 404);
    if (!(await assertEditToken(row, editToken))) {
      return c.json({ error: "Invalid edit token" }, 403);
    }
    const now = Date.now();
    await c.env.DB.prepare(
      "UPDATE attendees SET last_seen_at = ? WHERE id = ?",
    )
      .bind(now, row.id)
      .run();
    return c.json({ ok: true, lastSeenAt: now });
  },
);

app.post(
  "/api/attendees/:slug/leave",
  zValidator("json", presenceSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const { editToken } = c.req.valid("json");
    const row = await getAttendeeBySlug(c.env.DB, slug);
    if (!row) return c.json({ error: "Profile not found" }, 404);
    if (!(await assertEditToken(row, editToken))) {
      return c.json({ error: "Invalid edit token" }, 403);
    }
    const leftAt = Date.now() - ACTIVE_MS - 1000;
    await c.env.DB.prepare(
      "UPDATE attendees SET last_seen_at = ? WHERE id = ?",
    )
      .bind(leftAt, row.id)
      .run();
    return c.json({ ok: true });
  },
);

app.delete(
  "/api/attendees/:slug",
  zValidator("json", presenceSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const { editToken } = c.req.valid("json");
    const row = await getAttendeeBySlug(c.env.DB, slug);
    if (!row) return c.json({ error: "Profile not found" }, 404);
    if (!(await assertEditToken(row, editToken))) {
      return c.json({ error: "Invalid edit token" }, 403);
    }
    await c.env.DB.batch([
      c.env.DB.prepare(
        "DELETE FROM connections WHERE attendee_a = ? OR attendee_b = ?",
      ).bind(row.id, row.id),
      c.env.DB.prepare("DELETE FROM attendees WHERE id = ?").bind(row.id),
    ]);
    return c.json({ ok: true });
  },
);

app.post(
  "/api/attendees/:slug/meet",
  zValidator("json", meetSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const body = c.req.valid("json");
    const target = await getAttendeeBySlug(c.env.DB, slug);
    if (!target) return c.json({ error: "Profile not found" }, 404);

    const me = await getAttendeeById(c.env.DB, body.fromAttendeeId);
    if (!me) return c.json({ error: "Your profile was not found" }, 404);
    if (!(await assertEditToken(me, body.editToken))) {
      return c.json({ error: "Invalid edit token" }, 403);
    }
    if (me.id === target.id) {
      return c.json({ error: "You already know yourself" }, 400);
    }

    const [a, b] = pairKey(me.id, target.id);
    const existing = await c.env.DB.prepare(
      "SELECT id FROM connections WHERE attendee_a = ? AND attendee_b = ?",
    )
      .bind(a, b)
      .first();

    if (!existing) {
      await c.env.DB.prepare(
        "INSERT INTO connections (id, attendee_a, attendee_b, created_at) VALUES (?, ?, ?, ?)",
      )
        .bind(randomId("conn"), a, b, Date.now())
        .run();
    }

    const counts = await getConnectionCounts(c.env.DB, [me.id, target.id]);
    return c.json({
      ok: true,
      alreadyMet: Boolean(existing),
      me: toPublic(me, counts.get(me.id) ?? 0),
      them: toPublic(target, counts.get(target.id) ?? 0),
    });
  },
);

export default app;
