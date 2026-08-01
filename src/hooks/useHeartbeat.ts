import { useEffect } from "react";
import { heartbeat } from "../lib/api";
import { loadSession } from "../lib/storage";
import { HEARTBEAT_MS } from "../lib/types";

export function useHeartbeat() {
  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    let cancelled = false;

    const beat = () => {
      const current = loadSession();
      if (!current || cancelled) return;
      void heartbeat(current.slug, current.editToken).catch(() => {
        // Presence is best-effort; ignore transient failures.
      });
    };

    beat();
    const id = window.setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
}
