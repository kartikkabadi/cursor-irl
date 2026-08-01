CREATE TABLE attendees (
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
  open_to_meet INTEGER NOT NULL DEFAULT 1,
  cursor_color TEXT NOT NULL,
  cursor_code TEXT UNIQUE NOT NULL,
  edit_token_hash TEXT NOT NULL,
  last_seen_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_attendees_last_seen ON attendees(last_seen_at);
CREATE INDEX idx_attendees_slug ON attendees(slug);
CREATE INDEX idx_attendees_cursor_code ON attendees(cursor_code);

CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  attendee_a TEXT NOT NULL,
  attendee_b TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(attendee_a, attendee_b),
  FOREIGN KEY (attendee_a) REFERENCES attendees(id) ON DELETE CASCADE,
  FOREIGN KEY (attendee_b) REFERENCES attendees(id) ON DELETE CASCADE
);

CREATE INDEX idx_connections_a ON connections(attendee_a);
CREATE INDEX idx_connections_b ON connections(attendee_b);
