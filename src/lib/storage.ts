const STORAGE_KEY = "cursor-irl:session";

export type Session = {
  attendeeId: string;
  slug: string;
  editToken: string;
};

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
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
