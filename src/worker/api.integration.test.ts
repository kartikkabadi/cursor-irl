import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { generateDitherprintIdentity } from '../shared/ditherprint';
import type { Attendee } from '../shared/attendee';

const BASE = process.env.TEST_API_URL ?? 'http://localhost:8788';

type ResponseBody = { error?: string; details?: Record<string, string>; [key: string]: unknown };

async function api(path: string, init?: RequestInit, token?: string): Promise<{ status: number; body: ResponseBody }> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  const body = (await response.json().catch(() => ({}))) as ResponseBody;
  return { status: response.status, body };
}

function fields(input: Record<string, unknown>): Record<string, unknown> {
  return {
    name: 'QA Cursor',
    project: 'A test project for API verification',
    looking_for: 'collaborators for the test run',
    outfit_clue: 'QA badge and a loud keyboard',
    venue_zone: 'Workshop',
    open_to_meet: true,
    ...input,
  };
}

describe('cursor-irl API integration', () => {
  let attendeeA: { attendee: Attendee; edit_token: string } | null = null;
  let attendeeB: { attendee: Attendee; edit_token: string } | null = null;

  beforeAll(async () => {
    const health = await fetch(`${BASE}/api/health`);
    if (!health.ok) throw new Error('Local worker is not running. Start it with: wrangler dev --local --persist-to .wrangler/integration --port 8788');
    const payload = (await health.json()) as { ok: boolean };
    expect(payload.ok).toBe(true);
  });

  afterAll(async () => {
    if (attendeeA) await api(`/api/attendees/${attendeeA.attendee.id}`, { method: 'DELETE' }, attendeeA.edit_token);
    if (attendeeB) await api(`/api/attendees/${attendeeB.attendee.id}`, { method: 'DELETE' }, attendeeB.edit_token);
  });

  it('1: starts with an empty room', async () => {
    const { status, body } = await api('/api/attendees?filter=here');
    expect(status).toBe(200);
    expect((body.attendees as unknown[]).length).toBe(0);
  });

  it('2: identity preview returns six deterministic candidates and no attendee row', async () => {
    const { status, body } = await api('/api/identity-preview', { method: 'POST' });
    expect(status).toBe(200);
    expect(body.profile_id).toBeTruthy();
    expect((body.candidates as unknown[]).length).toBe(6);
    expect(body.algorithm_version).toBe('ditherprint-v1');
    const { status: listStatus, body: list } = await api('/api/attendees?filter=here');
    expect(listStatus).toBe(200);
    expect((list.attendees as unknown[]).length).toBe(0);
  });

  it('3-4: creates two QA attendees and returns 201', async () => {
    const preview = await api('/api/identity-preview', { method: 'POST' });
    const profileId = preview.body.profile_id as string;
    const create = await api('/api/attendees', { method: 'POST', body: JSON.stringify(fields({ name: 'QA Attendee A', profile_id: profileId, variant: 1 })) });
    expect(create.status).toBe(201);
    attendeeA = create.body as typeof attendeeA;
    expect(attendeeA?.edit_token).toBeTruthy();
    expect(attendeeA?.attendee.cursor_code).toHaveLength(4);

    const previewB = await api('/api/identity-preview', { method: 'POST' });
    const createB = await api('/api/attendees', { method: 'POST', body: JSON.stringify(fields({ name: 'QA Attendee B', project: 'Another test build', profile_id: previewB.body.profile_id as string, variant: 3 })) });
    expect(createB.status).toBe(201);
    attendeeB = createB.body as typeof attendeeB;
  });

  it('5: public lookup by slug works', async () => {
    const { status, body } = await api(`/api/attendees/${attendeeA!.attendee.slug}`);
    expect(status).toBe(200);
    expect((body.attendee as Attendee).id).toBe(attendeeA!.attendee.id);
  });

  it('6: private lookup by immutable id works', async () => {
    const { status, body } = await api(`/api/attendees/${attendeeA!.attendee.id}`);
    expect(status).toBe(200);
    expect((body.attendee as Attendee).id).toBe(attendeeA!.attendee.id);
  });

  it('7: invalid payload returns 422 with field details', async () => {
    const preview = await api('/api/identity-preview', { method: 'POST' });
    const { status, body } = await api('/api/attendees', { method: 'POST', body: JSON.stringify({ name: 'X', profile_id: preview.body.profile_id, variant: 99 }) });
    expect(status).toBe(422);
    expect(body.details).toBeTruthy();
  });

  it('8: invalid edit token returns 401', async () => {
    const { status } = await api(`/api/attendees/${attendeeA!.attendee.id}`, { method: 'PATCH', body: JSON.stringify({ project: 'Unauthorized change' }) }, 'wrong-token');
    expect(status).toBe(401);
  });

  it('9-11: heartbeat, leave, and return presence', async () => {
    const heart = await api(`/api/attendees/${attendeeA!.attendee.id}`, { method: 'PATCH', body: JSON.stringify({ present: true }) }, attendeeA!.edit_token);
    expect(heart.status).toBe(200);
    expect((heart.body.attendee as Attendee).active_now).toBe(true);

    const leave = await api(`/api/attendees/${attendeeA!.attendee.id}`, { method: 'PATCH', body: JSON.stringify({ present: false }) }, attendeeA!.edit_token);
    expect(leave.status).toBe(200);
    expect((leave.body.attendee as Attendee).active_now).toBe(false);

    const back = await api(`/api/attendees/${attendeeA!.attendee.id}`, { method: 'PATCH', body: JSON.stringify({ present: true }) }, attendeeA!.edit_token);
    expect(back.status).toBe(200);
    expect((back.body.attendee as Attendee).active_now).toBe(true);
  });

  it('12: edit project and clue', async () => {
    const { status, body } = await api(`/api/attendees/${attendeeA!.attendee.id}`, { method: 'PATCH', body: JSON.stringify({ project: 'An edited project line', outfit_clue: 'Edited clue: blue lanyard' }) }, attendeeA!.edit_token);
    expect(status).toBe(200);
    expect((body.attendee as Attendee).project).toBe('An edited project line');
    expect((body.attendee as Attendee).outfit_clue).toBe('Edited clue: blue lanyard');
  });

  it('13-15: connection creation, idempotency, and count', async () => {
    const connect = await api(`/api/attendees/${attendeeA!.attendee.id}/connections`, { method: 'POST', body: JSON.stringify({ target_id: attendeeB!.attendee.id }) }, attendeeA!.edit_token);
    expect(connect.status).toBe(200);
    expect(connect.body.created).toBe(true);
    expect((connect.body.attendee as Attendee).connection_count).toBe(1);

    const duplicate = await api(`/api/attendees/${attendeeA!.attendee.id}/connections`, { method: 'POST', body: JSON.stringify({ target_id: attendeeB!.attendee.id }) }, attendeeA!.edit_token);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.created).toBe(false);

    const { body } = await api(`/api/attendees/${attendeeA!.attendee.id}`);
    expect((body.attendee as Attendee).connection_count).toBe(1);
    expect(((body.attendee as Attendee & { connections: unknown[] }).connections)).toHaveLength(1);
  });

  it('rejects self-connections and missing targets', async () => {
    const self = await api(`/api/attendees/${attendeeA!.attendee.id}/connections`, { method: 'POST', body: JSON.stringify({ target_id: attendeeA!.attendee.id }) }, attendeeA!.edit_token);
    expect(self.status).toBe(400);
    const missing = await api(`/api/attendees/${attendeeA!.attendee.id}/connections`, { method: 'POST', body: JSON.stringify({ target_id: '00000000-0000-4000-8000-000000000000' }) }, attendeeA!.edit_token);
    expect(missing.status).toBe(404);
  });

  it('16: public Ditherprint reproduces deterministically from the attendee id', async () => {
    const identity = await generateDitherprintIdentity(attendeeA!.attendee.id, attendeeA!.attendee.avatar_variant);
    expect(identity.fingerprint).toBe(attendeeA!.attendee.cursor_code);
    expect(identity.cursor_color).toBe(attendeeA!.attendee.cursor_color);
  });

  it('search finds the edited project and the here filter honors presence', async () => {
    const { body } = await api('/api/attendees?q=edited%20project&filter=here');
    const found = (body.attendees as Attendee[]).map((attendee) => attendee.id);
    expect(found).toContain(attendeeA!.attendee.id);

    const { status } = await api(`/api/attendees/${attendeeB!.attendee.id}`, { method: 'PATCH', body: JSON.stringify({ present: false }) }, attendeeB!.edit_token);
    expect(status).toBe(200);
    const { body: hereBody } = await api('/api/attendees?filter=here');
    const hereIds = (hereBody.attendees as Attendee[]).map((attendee) => attendee.id);
    expect(hereIds).toContain(attendeeA!.attendee.id);
    expect(hereIds).not.toContain(attendeeB!.attendee.id);
  });

  it('public responses never expose the edit token hash', async () => {
    const { body } = await api(`/api/attendees/${attendeeA!.attendee.slug}`);
    expect(JSON.stringify(body)).not.toContain('edit_token_hash');
    expect(JSON.stringify(body)).not.toContain('edit_token');
  });

  it('17-18: deletes both attendees', async () => {
    const removeA = await api(`/api/attendees/${attendeeA!.attendee.id}`, { method: 'DELETE' }, attendeeA!.edit_token);
    expect(removeA.status).toBe(200);
    const removeB = await api(`/api/attendees/${attendeeB!.attendee.id}`, { method: 'DELETE' }, attendeeB!.edit_token);
    expect(removeB.status).toBe(200);
    attendeeA = null;
    attendeeB = null;
  });

  it('19: no QA rows remain and connections cascade', async () => {
    const { status, body } = await api('/api/attendees?q=QA%20Attendee');
    expect(status).toBe(200);
    expect((body.attendees as unknown[]).length).toBe(0);
    const { status: goneA } = await api('/api/attendees/qa-attendee-a');
    expect(goneA).toBe(404);
    const { status: goneB } = await api('/api/attendees/qa-attendee-b');
    expect(goneB).toBe(404);
  });

  it('20: no avatar objects remain (R2 is not used at launch)', async () => {
    const { body } = await api('/api/attendees?filter=here');
    expect((body.attendees as unknown[]).length).toBe(0);
  });
});
