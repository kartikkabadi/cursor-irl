CREATE TABLE IF NOT EXISTS attendees (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  x_handle TEXT,
  github_handle TEXT,
  avatar_url TEXT,
  project TEXT NOT NULL,
  looking_for TEXT,
  outfit_clue TEXT,
  venue_zone TEXT,
  open_to_meet INTEGER NOT NULL DEFAULT 1 CHECK (open_to_meet IN (0, 1)),
  cursor_color TEXT NOT NULL,
  cursor_code TEXT UNIQUE NOT NULL,
  edit_token_hash TEXT NOT NULL,
  last_seen_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  attendee_a TEXT NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  attendee_b TEXT NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE(attendee_a, attendee_b),
  CHECK (attendee_a < attendee_b)
);

CREATE INDEX IF NOT EXISTS attendees_last_seen_idx ON attendees(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS attendees_zone_idx ON attendees(venue_zone);
CREATE INDEX IF NOT EXISTS connections_attendee_a_idx ON connections(attendee_a);
CREATE INDEX IF NOT EXISTS connections_attendee_b_idx ON connections(attendee_b);
