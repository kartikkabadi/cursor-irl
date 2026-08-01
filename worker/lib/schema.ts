import { z } from "zod";

export const VENUE_ZONES = [
  "Entrance",
  "Stage left",
  "Stage right",
  "Workshop",
  "Coffee",
  "Food",
  "Outside",
] as const;

export const CURSOR_COLORS = [
  "#f54e00",
  "#c0a8dd",
  "#9fbbe0",
  "#dfa88f",
  "#9fc9a2",
  "#c08532",
  "#267f99",
  "#cf2d56",
  "#e8a87c",
  "#85a8d6",
] as const;

export const ACTIVE_MS = 10 * 60 * 1000;

export const joinSchema = z.object({
  name: z.string().trim().min(1).max(80),
  xHandle: z.string().trim().max(40).optional().or(z.literal("")),
  githubHandle: z.string().trim().max(40).optional().or(z.literal("")),
  avatarUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url().max(500).optional(),
  ),
  project: z.string().trim().min(1).max(200),
  lookingFor: z.string().trim().max(200).optional().or(z.literal("")),
  outfitClue: z.string().trim().max(160).optional().or(z.literal("")),
  venueZone: z.enum(VENUE_ZONES),
  openToMeet: z.boolean().default(true),
});

export const updateSchema = joinSchema.partial().extend({
  editToken: z.string().min(16),
});

export const meetSchema = z.object({
  fromAttendeeId: z.string().min(1),
  editToken: z.string().min(16),
});

export const presenceSchema = z.object({
  editToken: z.string().min(16),
});

export type JoinInput = z.infer<typeof joinSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;

export type AttendeeRow = {
  id: string;
  slug: string;
  name: string;
  x_handle: string | null;
  github_handle: string | null;
  avatar_url: string | null;
  project: string;
  looking_for: string | null;
  outfit_clue: string | null;
  venue_zone: string | null;
  open_to_meet: number;
  cursor_color: string;
  cursor_code: string;
  edit_token_hash: string;
  last_seen_at: number;
  created_at: number;
};

export type PublicAttendee = {
  id: string;
  slug: string;
  name: string;
  xHandle: string | null;
  githubHandle: string | null;
  avatarUrl: string | null;
  project: string;
  lookingFor: string | null;
  outfitClue: string | null;
  venueZone: string | null;
  openToMeet: boolean;
  cursorColor: string;
  cursorCode: string;
  lastSeenAt: number;
  createdAt: number;
  isActive: boolean;
  connectionCount: number;
  colorName: string;
};

export function colorName(hex: string): string {
  const map: Record<string, string> = {
    "#f54e00": "orange",
    "#c0a8dd": "lavender",
    "#9fbbe0": "blue",
    "#dfa88f": "peach",
    "#9fc9a2": "mint",
    "#c08532": "gold",
    "#267f99": "teal",
    "#cf2d56": "rose",
    "#e8a87c": "coral",
    "#85a8d6": "sky",
  };
  return map[hex.toLowerCase()] ?? "bright";
}

export function toPublic(
  row: AttendeeRow,
  connectionCount: number,
  now = Date.now(),
): PublicAttendee {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    xHandle: row.x_handle,
    githubHandle: row.github_handle,
    avatarUrl: row.avatar_url,
    project: row.project,
    lookingFor: row.looking_for,
    outfitClue: row.outfit_clue,
    venueZone: row.venue_zone,
    openToMeet: row.open_to_meet === 1,
    cursorColor: row.cursor_color,
    cursorCode: row.cursor_code,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    isActive: now - row.last_seen_at < ACTIVE_MS,
    connectionCount,
    colorName: colorName(row.cursor_color),
  };
}

export function normalizeHandle(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^@/, "");
  return trimmed.length ? trimmed : null;
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "builder";
}
