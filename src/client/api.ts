import type {
  Attendee,
  AttendeeDetail,
  CreateAttendeeInput,
  CreateAttendeeResponse,
  IdentityPreviewResponse,
  LeaderboardEntry,
  UpdateAttendeeInput,
} from '../shared/attendee';

const API_PREFIX = import.meta.env.BASE_URL;

export type CursorUsageResponse = { handle: string; profile_url: string; tokens: number | null; available: boolean };

export function absoluteUrl(path: string): string {
  return `${window.location.origin}${API_PREFIX}${path.replace(/^\//, '')}`;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body) headers.set('content-type', 'application/json');
  if (options?.token) headers.set('authorization', `Bearer ${options.token}`);
  const response = await fetch(`${API_PREFIX}${path.replace(/^\//, '')}`, { ...options, headers });
  const payload = (await response.json().catch(() => null)) as { error?: string; details?: Record<string, string> } & T;
  if (!response.ok) throw new ApiError(payload?.error ?? 'The room is unavailable.', response.status, payload?.details);
  return payload as T;
}

export async function getIdentityPreview() {
  return request<IdentityPreviewResponse>('/api/identity-preview', { method: 'POST' });
}

export async function listAttendees(query = '', filter = 'all', signal?: AbortSignal) {
  const params = new URLSearchParams({ filter });
  if (query) params.set('q', query);
  return request<{ attendees: Attendee[] }>(`/api/attendees?${params}`, { signal });
}

export async function getLeaderboard(signal?: AbortSignal) {
  return request<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard', { signal });
}

export async function getAttendee(slug: string) {
  return request<{ attendee: AttendeeDetail }>(`/api/attendees/${encodeURIComponent(slug)}`);
}

export async function getAttendeeById(id: string) {
  return request<{ attendee: AttendeeDetail }>(`/api/attendees/${encodeURIComponent(id)}`);
}

export async function getCursorUsage(handle: string, signal?: AbortSignal) {
  return request<CursorUsageResponse>(`/api/cursor/${encodeURIComponent(handle)}`, { signal });
}

export async function createAttendee(input: CreateAttendeeInput) {
  return request<CreateAttendeeResponse>('/api/attendees', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateAttendee(id: string, token: string, input: UpdateAttendeeInput) {
  return request<{ attendee: Attendee }>(`/api/attendees/${id}`, { method: 'PATCH', token, body: JSON.stringify(input) });
}

export async function connectAttendees(id: string, token: string, targetId: string) {
  return request<{ created: boolean; attendee: Attendee | null }>(`/api/attendees/${id}/connections`, {
    method: 'POST', token, body: JSON.stringify({ target_id: targetId }),
  });
}

export async function deleteAttendee(id: string, token: string) {
  return request<{ deleted: boolean }>(`/api/attendees/${id}`, { method: 'DELETE', token });
}
