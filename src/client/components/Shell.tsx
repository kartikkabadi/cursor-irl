import { Link, NavLink } from 'react-router-dom';
import { Broadcast, Cursor, GithubLogo, House, Plus, UserCircle } from '@phosphor-icons/react';

const nav = [
  { to: '/', label: 'Room', icon: House },
  { to: '/join', label: 'Join', icon: Plus },
  { to: '/me', label: 'My card', icon: UserCircle },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color:var(--paper)/.9] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <Link to="/" className="group inline-flex items-center gap-3" aria-label="Cursor IRL home">
          <span className="relative grid h-8 w-8 place-items-center rounded-[9px] border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] transition group-hover:-rotate-6"><Cursor size={17} weight="bold" /></span>
          <span className="hidden text-sm font-semibold tracking-[-0.02em] sm:block">Cursor IRL</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] md:inline-flex"><Broadcast size={13} weight="fill" className="soft-pulse text-[#5C9C77]" /> Bangalore / live room</span>
          <nav className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-white/45 p-1" aria-label="Main navigation">
            {nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} aria-label={label} className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold transition sm:px-3 ${isActive ? 'bg-[var(--ink)] text-[var(--paper)]' : 'text-[var(--muted)] hover:bg-white/70 hover:text-[var(--ink)]'}`}><Icon size={14} weight={to === '/join' ? 'bold' : 'regular'} /><span>{label}</span></NavLink>)}
          </nav>
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="mx-auto flex max-w-[1400px] flex-col gap-3 border-t border-[var(--line)] px-4 py-8 text-[11px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>Made in the room, for the room.</span><div className="flex flex-wrap items-center gap-4"><a href="https://github.com/kartikkabadi/cursor-irl" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold transition hover:text-[var(--ink)]" aria-label="Cursor IRL source on GitHub"><GithubLogo size={14} /> Source</a><span className="font-mono uppercase tracking-[0.12em]">Cursor Roadshow / Bangalore</span></div></footer>
  </div>;
}
