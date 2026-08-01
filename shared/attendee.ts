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

export const CURSOR_PALETTE = [
  { hex: "#f54e00", name: "orange" },
  { hex: "#c0a8dd", name: "lavender" },
  { hex: "#9fbbe0", name: "blue" },
  { hex: "#dfa88f", name: "peach" },
  { hex: "#9fc9a2", name: "mint" },
  { hex: "#c08532", name: "gold" },
  { hex: "#267f99", name: "teal" },
  { hex: "#cf2d56", name: "rose" },
  { hex: "#e8a87c", name: "coral" },
  { hex: "#85a8d6", name: "sky" },
] as const;

export type CursorColor = (typeof CURSOR_PALETTE)[number]["hex"];

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

export function colorName(hex: string): string {
  const hit = CURSOR_PALETTE.find(
    (entry) => entry.hex.toLowerCase() === hex.toLowerCase(),
  );
  return hit?.name ?? "bright";
}

export function randomCursorColor(): string {
  const entry =
    CURSOR_PALETTE[Math.floor(Math.random() * CURSOR_PALETTE.length)]!;
  return entry.hex;
}
