import type { DitherprintIdentity } from './ditherprint';

export const VENUE_ZONES = [
  'Entrance',
  'Stage left',
  'Stage right',
  'Workshop',
  'Coffee',
  'Food',
  'Outside',
] as const;

export type VenueZone = (typeof VENUE_ZONES)[number];

export const AVATAR_MODES = ['ditherprint', 'photo', 'photo-frame'] as const;
export type AvatarMode = (typeof AVATAR_MODES)[number];

export type Attendee = {
  id: string;
  slug: string;
  name: string;
  x_handle: string | null;
  cursor_handle: string | null;
  github_handle: string | null;
  avatar_mode: AvatarMode;
  avatar_variant: number;
  avatar_algorithm_version: string;
  avatar_image_ref: string | null;
  avatar_url: string | null;
  project: string;
  looking_for: string | null;
  outfit_clue: string | null;
  venue_zone: VenueZone | null;
  open_to_meet: boolean;
  cursor_color: string;
  cursor_code: string;
  created_at: number;
  connection_count: number;
};

export type AttendeeConnection = Pick<Attendee, 'id' | 'slug' | 'name' | 'cursor_color' | 'cursor_code' | 'avatar_variant' | 'avatar_algorithm_version'> & {
  created_at: number;
};

export type AttendeeDetail = Attendee & {
  connections: AttendeeConnection[];
};

export type CreateAttendeeInput = {
  name: string;
  x_handle?: string;
  cursor_handle?: string;
  github_handle?: string;
  avatar_mode?: AvatarMode;
  avatar_url?: string;
  project: string;
  looking_for?: string;
  outfit_clue?: string;
  venue_zone?: VenueZone;
  open_to_meet: boolean;
  profile_id: string;
  variant: number;
};

export type UpdateAttendeeInput = Partial<CreateAttendeeInput>;

export type CreateAttendeeResponse = {
  attendee: Attendee;
  edit_token: string;
};

export type IdentityPreviewResponse = {
  profile_id: string;
  algorithm_version: string;
  candidates: DitherprintIdentity[];
};

export type LeaderboardEntry = Pick<Attendee, 'id' | 'slug' | 'name' | 'cursor_color' | 'cursor_code' | 'avatar_variant' | 'avatar_algorithm_version'> & {
  connection_count: number;
};
