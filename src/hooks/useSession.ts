import { useEffect, useState } from "react";
import {
  clearSession,
  loadSession,
  patchSession,
  saveSession,
  SESSION_EVENT,
  type Session,
} from "../lib/storage";

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    session,
    saveSession,
    patchSession,
    clearSession,
  };
}
