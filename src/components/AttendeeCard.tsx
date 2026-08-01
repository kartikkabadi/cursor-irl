import { Link } from "react-router-dom";
import type { PublicAttendee } from "../lib/types";
import { CursorPointer } from "./CursorPointer";

type Props = {
  person: PublicAttendee;
};

export function AttendeeCard({ person }: Props) {
  return (
    <Link
      to={`/p/${person.slug}`}
      className="group block rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 transition-colors duration-150 hover:bg-[color:var(--color-card-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-accent)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base text-[color:var(--color-text)]">
              {person.name}
            </h3>
            {person.isActive ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-success)]">
                <span className="presence-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
                here
              </span>
            ) : null}
          </div>
          {person.xHandle ? (
            <p className="mt-0.5 font-mono text-xs text-[color:var(--color-text-muted)]">
              @{person.xHandle}
            </p>
          ) : null}
        </div>
        <CursorPointer
          color={person.cursorColor}
          code={person.cursorCode}
          size="sm"
          className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-[color:var(--color-text)]">
        {person.project}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[color:var(--color-text-muted)]">
        {person.venueZone ? <span>{person.venueZone}</span> : null}
        {person.openToMeet ? <span>open to meet</span> : null}
        <span>
          {person.connectionCount} met
        </span>
      </div>
    </Link>
  );
}
