import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard, listAttendees } from "../lib/api";
import { POLL_MS, type FilterKey, type PublicAttendee } from "../lib/types";
import { AttendeeCard } from "../components/AttendeeCard";
import { CardSkeleton, EmptyState } from "../components/EmptyState";
import { CursorPointer } from "../components/CursorPointer";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "here", label: "Here now" },
  { key: "open", label: "Open to meet" },
  { key: "agents", label: "Building agents" },
  { key: "collab", label: "Looking for collaborators" },
];

export function HomePage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("here");
  const [attendees, setAttendees] = useState<PublicAttendee[]>([]);
  const [leaders, setLeaders] = useState<PublicAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, board] = await Promise.all([
        listAttendees({
          q,
          filter: filter === "all" ? undefined : filter,
          all: filter === "all" || filter === "collab" || filter === "agents",
        }),
        getLeaderboard(),
      ]);
      setAttendees(list.attendees);
      setLeaders(board.leaders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => {
    setLoading(true);
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-5 py-8 sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 18%, rgba(245,78,0,0.14), transparent 42%), radial-gradient(circle at 88% 10%, rgba(192,168,221,0.18), transparent 36%), linear-gradient(180deg, transparent, rgba(38,37,30,0.03))",
          }}
        />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            Cursor IRL · Bangalore
          </p>
          <h1 className="mt-3 max-w-xl text-[2rem] leading-[1.15] tracking-[-0.03em] sm:text-5xl">
            Who’s actually here?
          </h1>
          <p className="mt-3 max-w-lg text-base text-[color:var(--color-text-muted)]">
            Find the humans behind the handles at Cursor Roadshow Bangalore.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/join" className="btn-primary">
              Join the room
            </Link>
            <p className="font-mono text-xs text-[color:var(--color-text-muted)]">
              Turn handles into handshakes.
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute right-4 top-6 hidden opacity-90 sm:block">
          <CursorPointer color="#f54e00" code="IRL" size="lg" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg tracking-tight">Live room</h2>
          <label className="block w-full sm:max-w-xs">
            <span className="sr-only">Search</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, handle, project…"
              className="field"
            />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                filter === f.key
                  ? "bg-[color:var(--color-text)] text-[color:var(--color-bg)]"
                  : "bg-[color:var(--color-muted-surface)] text-[color:var(--color-text)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="text-sm text-[color:var(--color-error)]">{error}</p>
        ) : null}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : attendees.length === 0 ? (
          <EmptyState
            title="No cursors in this filter"
            body="Be the first to join the room, or widen the filter. Profiles vanish from Here now after ten quiet minutes."
            action={
              <Link to="/join" className="btn-primary">
                Join the room
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {attendees.map((person) => (
              <AttendeeCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg tracking-tight">Friendly leaderboard</h2>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          How many internet identities can you resolve into actual humans?
        </p>
        <div className="overflow-hidden rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)]">
          {leaders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[color:var(--color-text-muted)]">
              No meetings logged yet. Scan a QR, tap “I met this person.”
            </p>
          ) : (
            <ul>
              {leaders.map((person, index) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-3 last:border-b-0"
                >
                  <span className="w-6 font-mono text-xs text-[color:var(--color-text-muted)]">
                    {index + 1}
                  </span>
                  <CursorPointer
                    color={person.cursorColor}
                    code={person.cursorCode}
                    size="sm"
                    animate={false}
                  />
                  <Link
                    to={`/p/${person.slug}`}
                    className="min-w-0 flex-1 truncate text-sm hover:text-[color:var(--color-accent)]"
                  >
                    {person.name}
                  </Link>
                  <span className="font-mono text-xs text-[color:var(--color-text-muted)]">
                    {person.connectionCount} met
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
