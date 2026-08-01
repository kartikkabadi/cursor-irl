import { useEffect } from "react";
import { heartbeat } from "../lib/api";
import { useSession } from "./useSession";
import { HEARTBEAT_MS } from "../lib/types";

export function useHeartbeat() {
  const { session } = useSession();

  useEffect(() => {
    if (!session || session.paused) return;

    let cancelled = false;

    const beat = () => {
      if (cancelled) return;
      void heartbeat(session.slug, session.editToken).catch(() => {
        // Presence is best-effort; ignore transient failures.
      });
    };

    beat();
    const id = window.setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [session?.slug, session?.editToken, session?.paused]);
}
