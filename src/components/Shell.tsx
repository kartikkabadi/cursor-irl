import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { CursorGlyph } from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  const { session } = useSession();

  return (
    <div className="min-h-dvh bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2">
            <CursorGlyph color="#f54e00" className="h-[18px] w-[18px]" />
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
