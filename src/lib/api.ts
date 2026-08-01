import type { JoinPayload, PublicAttendee } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export function listAttendees(params: {
  q?: string;
  filter?: string;
  all?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.filter && params.filter !== "all") sp.set("filter", params.filter);
  if (params.all) sp.set("all", "1");
  const qs = sp.toString();
  return request<{ attendees: PublicAttendee[]; activeWindowMs: number }>(
    `/api/attendees${qs ? `?${qs}` : ""}`,
  );
}

export function getLeaderboard() {
  return request<{ leaders: PublicAttendee[] }>("/api/leaderboard");
}

export function getProfile(slug: string) {
  return request<{
    attendee: PublicAttendee;
    connections: PublicAttendee[];
    profileUrl: string;
    tweetIntentUrl: string;
  }>(`/api/attendees/${encodeURIComponent(slug)}`);
}

export function createAttendee(payload: JoinPayload) {
  return request<{ attendee: PublicAttendee; editToken: string }>(
    "/api/attendees",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateAttendee(
  slug: string,
  payload: Partial<JoinPayload> & { editToken: string },
) {
  return request<{ attendee: PublicAttendee }>(
    `/api/attendees/${encodeURIComponent(slug)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function heartbeat(slug: string, editToken: string) {
  return request<{ ok: boolean; lastSeenAt: number }>(
    `/api/attendees/${encodeURIComponent(slug)}/heartbeat`,
    { method: "POST", body: JSON.stringify({ editToken }) },
  );
}

export function leaveEvent(slug: string, editToken: string) {
  return request<{ ok: boolean }>(
    `/api/attendees/${encodeURIComponent(slug)}/leave`,
    { method: "POST", body: JSON.stringify({ editToken }) },
  );
}

export function deleteAttendee(slug: string, editToken: string) {
  return request<{ ok: boolean }>(
    `/api/attendees/${encodeURIComponent(slug)}`,
    { method: "DELETE", body: JSON.stringify({ editToken }) },
  );
}

export function meetPerson(
  slug: string,
  fromAttendeeId: string,
  editToken: string,
) {
  return request<{
    ok: boolean;
    alreadyMet: boolean;
    me: PublicAttendee;
    them: PublicAttendee;
  }>(`/api/attendees/${encodeURIComponent(slug)}/meet`, {
    method: "POST",
    body: JSON.stringify({ fromAttendeeId, editToken }),
  });
}
