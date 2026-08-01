import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfile, meetPerson } from "../lib/api";
import { loadSession } from "../lib/storage";
import type { PublicAttendee } from "../lib/types";
import { CursorPointer } from "../components/CursorPointer";
import { QrCode } from "../components/QrCode";

export function ProfilePage() {
  const { slug = "" } = useParams();
  const session = loadSession();
  const [person, setPerson] = useState<PublicAttendee | null>(null);
  const [connections, setConnections] = useState<PublicAttendee[]>([]);
  const [profileUrl, setProfileUrl] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [meetMsg, setMeetMsg] = useState<string | null>(null);
  const [meeting, setMeeting] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await getProfile(slug);
      setPerson(data.attendee);
      setConnections(data.connections);
      setProfileUrl(data.profileUrl);
      setTweetUrl(data.tweetIntentUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not found");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onMeet() {
    if (!session || !person) return;
    setMeeting(true);
    setMeetMsg(null);
    try {
      const result = await meetPerson(
        person.slug,
        session.attendeeId,
        session.editToken,
      );
      setMeetMsg(
        result.alreadyMet
          ? "Already logged — Met IRL."
          : "Met IRL. Connection saved for both of you.",
      );
      await load();
    } catch (err) {
      setMeetMsg(err instanceof Error ? err.message : "Could not connect");
    } finally {
      setMeeting(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl">Profile not found</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">{error}</p>
        <Link to="/" className="btn-secondary">
          Back to room
        </Link>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 rounded-[4px] bg-[color:var(--color-card)]" />
        <div className="h-24 rounded-[4px] bg-[color:var(--color-card)]" />
      </div>
    );
  }

  const isOwner = session?.slug === person.slug;
  const alreadyConnected = connections.some((c) => c.id === session?.attendeeId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="relative overflow-hidden rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {person.isActive ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-success)]">
                  <span className="presence-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
                  Active now
                </span>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-text-muted)]">
                  Away
                </span>
              )}
              {alreadyConnected || meetMsg?.includes("Met IRL") ? (
                <span className="rounded-full bg-[color:var(--color-muted-surface)] px-2.5 py-0.5 font-mono text-[11px]">
                  Met IRL
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 text-3xl tracking-tight sm:text-4xl">
              {person.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 font-mono text-xs text-[color:var(--color-text-muted)]">
              {person.xHandle ? (
                <a
                  href={`https://x.com/${person.xHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[color:var(--color-accent)]"
                >
                  @{person.xHandle}
                </a>
              ) : null}
              {person.githubHandle ? (
                <a
                  href={`https://github.com/${person.githubHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[color:var(--color-accent)]"
                >
                  gh/{person.githubHandle}
                </a>
              ) : null}
            </div>
            <p className="mt-4 text-base">{person.project}</p>
            {person.lookingFor ? (
              <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                Looking for: {person.lookingFor}
              </p>
            ) : null}
            <div className="mt-4 space-y-1 font-mono text-xs text-[color:var(--color-text-muted)]">
              {person.venueZone ? <p>Near: {person.venueZone}</p> : null}
              {person.outfitClue ? <p>Find me: {person.outfitClue}</p> : null}
              <p>
                Cursor: {person.colorName} {person.cursorCode}
              </p>
              <p>{person.connectionCount} connections</p>
            </div>
          </div>
          <CursorPointer
            color={person.cursorColor}
            code={person.cursorCode}
            size="xl"
            className="self-center sm:self-start"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
          <h2 className="text-sm tracking-tight">QR</h2>
          <div className="mt-3 flex justify-center">
            <QrCode value={profileUrl || window.location.href} label={person.slug} />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
          <h2 className="text-sm tracking-tight">Actions</h2>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-center"
          >
            Post on X
          </a>
          {!isOwner && session ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={meeting}
              onClick={() => void onMeet()}
            >
              {meeting ? "Saving…" : "I met this person"}
            </button>
          ) : null}
          {!session ? (
            <Link to="/join" className="btn-secondary text-center">
              Join to log a meeting
            </Link>
          ) : null}
          {isOwner ? (
            <Link to="/me" className="btn-ghost text-center">
              Manage my profile
            </Link>
          ) : null}
          {meetMsg ? (
            <p className="text-sm text-[color:var(--color-text-muted)]">{meetMsg}</p>
          ) : null}
        </div>
      </section>

      {connections.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg tracking-tight">Met IRL</h2>
          <div className="flex flex-wrap gap-3">
            {connections.map((c) => (
              <Link
                key={c.id}
                to={`/p/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-sm hover:bg-[color:var(--color-card-hover)]"
              >
                <CursorPointer
                  color={c.cursorColor}
                  code={c.cursorCode}
                  size="sm"
                  animate={false}
                />
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
