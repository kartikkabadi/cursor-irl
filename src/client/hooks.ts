import { useEffect, useRef } from 'react';
import { updateAttendee } from './api';

export function useHeartbeat(id: string | undefined, token: string | undefined, enabled = true) {
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!id || !token || !enabled) return;
    let stopped = false;
    const send = () => {
      if (!stopped && document.visibilityState === 'visible') {
        void updateAttendee(id, tokenRef.current ?? token, { present: true }).catch(() => undefined);
      }
    };
    send();
    const timer = window.setInterval(send, 60_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') send(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [id, token, enabled]);
}
