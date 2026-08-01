import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { loadSession, type Session } from "../lib/storage";

export function Shell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(() => loadSession());

  useEffect(() => {
    setSession(loadSession());
  }, [location.pathname]);

  return (
    <div className="min-h-dvh bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden>
              <path
                d="M5 3.5 L5 24.5 L11.2 18.8 L16.8 28.2 L20.2 26.4 L14.5 16.8 L22.5 16.2 Z"
                fill="#f54e00"
                stroke="#26251e"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm tracking-tight">
              Cursor <span className="text-[color:var(--color-accent)]">IRL</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[color:var(--color-muted-surface)]"
                    : "hover:bg-[color:var(--color-card)]"
                }`
              }
              end
            >
              Room
            </NavLink>
            {session ? (
              <NavLink
                to="/me"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[color:var(--color-muted-surface)]"
                      : "hover:bg-[color:var(--color-card)]"
                  }`
                }
              >
                Me
              </NavLink>
            ) : null}
            <Link to="/join" className="btn-primary text-sm">
              Join
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6">{children}</main>
      <footer className="border-t border-[color:var(--color-border)] py-6 text-center font-mono text-[11px] text-[color:var(--color-text-muted)]">
        Turn handles into handshakes · Cursor Roadshow Bangalore
      </footer>
    </div>
  );
}
