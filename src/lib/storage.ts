const STORAGE_KEY = "cursor-irl:session";
export const SESSION_EVENT = "cursor-irl:session";

export type Session = {
  attendeeId: string;
  slug: string;
  editToken: string;
  paused?: boolean;
};

function emitSessionChange(): void {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.attendeeId || !parsed?.slug || !parsed?.editToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emitSessionChange();
}

export function patchSession(patch: Partial<Session>): Session | null {
  const current = loadSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveSession(next);
  return next;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  emitSessionChange();
}
