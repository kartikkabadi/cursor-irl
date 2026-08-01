export const ACTIVE_MS = 10 * 60 * 1000;
export const HEARTBEAT_MS = 60_000;
export const POLL_MS = 10_000;

export const VENUE_ZONES = [
  "Entrance",
  "Stage left",
  "Stage right",
  "Workshop",
  "Coffee",
  "Food",
  "Outside",
] as const;

export type VenueZone = (typeof VENUE_ZONES)[number];

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

export type JoinPayload = {
  name: string;
  xHandle?: string;
  githubHandle?: string;
  avatarUrl?: string;
  project: string;
  lookingFor?: string;
  outfitClue?: string;
  venueZone: VenueZone;
  openToMeet: boolean;
};

export type FilterKey = "all" | "here" | "open" | "agents" | "collab";
