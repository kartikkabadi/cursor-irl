import { z } from "zod";
import {
  ACTIVE_MS,
  colorName,
  VENUE_ZONES,
  type PublicAttendee,
} from "../../shared/attendee";

export { ACTIVE_MS, colorName, VENUE_ZONES };
export type { PublicAttendee };

export const joinSchema = z.object({
  name: z.string().trim().min(1).max(80),
  xHandle: z.string().trim().max(40).optional().or(z.literal("")),
  githubHandle: z.string().trim().max(40).optional().or(z.literal("")),
  avatarUrl: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
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
