import type { DitherprintIdentity } from '../shared/ditherprint';

const ACTIVE_PROFILE_KEY = 'cursor-irl:active-profile';
const DRAFT_KEY = 'cursor-irl:identity-draft';
const tokenKey = (id: string) => `cursor-irl:edit-token:${id}`;

export function saveProfileSession(id: string, token: string) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  localStorage.setItem(tokenKey(id), token);
}

export function getProfileSession(): { id: string; token: string } | null {
  const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!id) return null;
  const token = localStorage.getItem(tokenKey(id));
  return token ? { id, token } : null;
}

export function clearProfileSession() {
  const session = getProfileSession();
  if (session) localStorage.removeItem(tokenKey(session.id));
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

export type IdentityDraft = {
  profile_id: string;
  algorithm_version: string;
  candidates: DitherprintIdentity[];
};

export function saveIdentityDraft(draft: IdentityDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Session storage can be unavailable in private modes; the join flow still works.
  }
}

export function getIdentityDraft(): IdentityDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as IdentityDraft;
    if (!draft?.profile_id || !Array.isArray(draft.candidates) || draft.candidates.length === 0) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearIdentityDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // No-op when session storage is unavailable.
  }
}
