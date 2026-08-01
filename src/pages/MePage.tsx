import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteAttendee,
  getProfile,
  leaveEvent,
  updateAttendee,
} from "../lib/api";
import { patchSession } from "../lib/storage";
import { useSession } from "../hooks/useSession";
import { VENUE_ZONES, type PublicAttendee, type VenueZone } from "../lib/types";
import { CursorPointer } from "../components/CursorPointer";
import { QrCode } from "../components/QrCode";
import { Field } from "../components/ui";

export function MePage() {
  const navigate = useNavigate();
  const { session, clearSession: wipeSession } = useSession();
  const [person, setPerson] = useState<PublicAttendee | null>(null);
  const [connections, setConnections] = useState<PublicAttendee[]>([]);
  const [profileUrl, setProfileUrl] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [findMe, setFindMe] = useState(false);

  const [name, setName] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [project, setProject] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [outfitClue, setOutfitClue] = useState("");
  const [venueZone, setVenueZone] = useState<VenueZone>("Workshop");
  const [openToMeet, setOpenToMeet] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await getProfile(session.slug);
      setPerson(data.attendee);
      setConnections(data.connections);
      setProfileUrl(data.profileUrl);
      setTweetUrl(data.tweetIntentUrl);
      setName(data.attendee.name);
      setXHandle(data.attendee.xHandle ?? "");
      setGithubHandle(data.attendee.githubHandle ?? "");
      setAvatarUrl(data.attendee.avatarUrl ?? "");
      setProject(data.attendee.project);
      setLookingFor(data.attendee.lookingFor ?? "");
      setOutfitClue(data.attendee.outfitClue ?? "");
      setVenueZone((data.attendee.venueZone as VenueZone) || "Workshop");
      setOpenToMeet(data.attendee.openToMeet);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile");
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    void load();
  }, [session, load]);

  if (!session) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl tracking-tight">No local profile</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Join the room on this device to get an edit token.
        </p>
        <Link to="/join" className="btn-primary">
          Join the room
        </Link>
      </div>
    );
  }

  return (
    <MeBody
      session={session}
      person={person}
      connections={connections}
      profileUrl={profileUrl}
      tweetUrl={tweetUrl}
      error={error}
      status={status}
      setStatus={setStatus}
      editing={editing}
      setEditing={setEditing}
      findMe={findMe}
      setFindMe={setFindMe}
      name={name}
      setName={setName}
      xHandle={xHandle}
      setXHandle={setXHandle}
      githubHandle={githubHandle}
      setGithubHandle={setGithubHandle}
      avatarUrl={avatarUrl}
      setAvatarUrl={setAvatarUrl}
      project={project}
      setProject={setProject}
      lookingFor={lookingFor}
      setLookingFor={setLookingFor}
      outfitClue={outfitClue}
      setOutfitClue={setOutfitClue}
      venueZone={venueZone}
      setVenueZone={setVenueZone}
      openToMeet={openToMeet}
      setOpenToMeet={setOpenToMeet}
      load={load}
      wipeSession={wipeSession}
      navigate={navigate}
    />
  );
}

type BodyProps = {
  session: NonNullable<ReturnType<typeof useSession>["session"]>;
  person: PublicAttendee | null;
  connections: PublicAttendee[];
  profileUrl: string;
  tweetUrl: string;
  error: string | null;
  status: string | null;
  setStatus: (v: string | null) => void;
  editing: boolean;
  setEditing: (v: boolean | ((prev: boolean) => boolean)) => void;
  findMe: boolean;
  setFindMe: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  xHandle: string;
  setXHandle: (v: string) => void;
  githubHandle: string;
  setGithubHandle: (v: string) => void;
  avatarUrl: string;
  setAvatarUrl: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  lookingFor: string;
  setLookingFor: (v: string) => void;
  outfitClue: string;
  setOutfitClue: (v: string) => void;
  venueZone: VenueZone;
  setVenueZone: (v: VenueZone) => void;
  openToMeet: boolean;
  setOpenToMeet: (v: boolean) => void;
  load: () => Promise<void>;
  wipeSession: () => void;
  navigate: ReturnType<typeof useNavigate>;
};

function MeBody({
  session,
  person,
  connections,
  profileUrl,
  tweetUrl,
  error,
  status,
  setStatus,
  editing,
  setEditing,
  findMe,
  setFindMe,
  name,
  setName,
  xHandle,
  setXHandle,
  githubHandle,
  setGithubHandle,
  avatarUrl,
  setAvatarUrl,
  project,
  setProject,
  lookingFor,
  setLookingFor,
  outfitClue,
  setOutfitClue,
  venueZone,
  setVenueZone,
  openToMeet,
  setOpenToMeet,
  load,
  wipeSession,
  navigate,
}: BodyProps) {
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl">Couldn’t load /me</h1>
        <p className="text-sm text-[color:var(--color-error)]">{error}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            wipeSession();
            navigate("/join");
          }}
        >
          Clear local token & rejoin
        </button>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="h-40 animate-pulse rounded-[4px] bg-[color:var(--color-card)]" />
    );
  }

  if (findMe) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[color:var(--color-bg)] p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
          Find me
        </p>
        <h1 className="mt-4 text-4xl tracking-tight sm:text-6xl">{person.name}</h1>
        <div className="mt-8">
          <CursorPointer
            color={person.cursorColor}
            code={person.cursorCode}
            size="xl"
          />
        </div>
        <p className="mt-8 max-w-md text-lg">
          {person.colorName} {person.cursorCode} · {person.venueZone}
        </p>
        {person.outfitClue ? (
          <p className="mt-2 text-[color:var(--color-text-muted)]">
            {person.outfitClue}
          </p>
        ) : null}
        <div className="mt-8">
          <QrCode value={profileUrl} />
        </div>
        <p className="mt-4 font-mono text-xs text-[color:var(--color-text-muted)]">
          Find everyone posting from this room.
        </p>
        <button
          type="button"
          className="btn-secondary mt-8"
          onClick={() => setFindMe(false)}
        >
          Close
        </button>
      </div>
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    try {
      await updateAttendee(session.slug, {
        editToken: session.editToken,
        name,
        xHandle,
        githubHandle,
        avatarUrl,
        project,
        lookingFor,
        outfitClue,
        venueZone,
        openToMeet,
      });
      patchSession({ paused: false });
      setStatus("Saved.");
      setEditing(false);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onLeave() {
    try {
      await leaveEvent(session.slug, session.editToken);
      patchSession({ paused: true });
      setStatus(
        "You’re marked as left. Heartbeats are paused until you tap I’m back.",
      );
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Leave failed");
    }
  }

  async function onBack() {
    patchSession({ paused: false });
    setStatus("You’re back in the room.");
    await load();
  }

  async function onDelete() {
    if (!window.confirm("Delete your profile and connections from this room?")) {
      return;
    }
    try {
      await deleteAttendee(session.slug, session.editToken);
      wipeSession();
      navigate("/");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            Your cursor
          </p>
          <h1 className="mt-2 text-3xl tracking-tight">{person.name}</h1>
          {session.paused ? (
            <p className="mt-1 font-mono text-xs text-[color:var(--color-text-muted)]">
              Presence paused
            </p>
          ) : null}
        </div>
        <CursorPointer
          color={person.cursorColor}
          code={person.cursorCode}
          size="lg"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setFindMe(true)}
        >
          Find me card
        </button>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          Post on X
        </a>
        <Link to={`/p/${person.slug}`} className="btn-ghost">
          Public profile
        </Link>
        {session.paused ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void onBack()}
          >
            I’m back
          </button>
        ) : (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void onLeave()}
          >
            I left
          </button>
        )}
      </div>

      <div className="rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
        <QrCode value={profileUrl} label={profileUrl} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg tracking-tight">Edit profile</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Close" : "Edit"}
          </button>
        </div>
        {editing ? (
          <form onSubmit={onSave} className="space-y-3">
            <Field label="Name" required>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="X handle">
              <input
                className="field"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
              />
            </Field>
            <Field label="GitHub">
              <input
                className="field"
                value={githubHandle}
                onChange={(e) => setGithubHandle(e.target.value)}
              />
            </Field>
            <Field label="Avatar URL">
              <input
                className="field"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </Field>
            <Field label="Building" required>
              <input
                className="field"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                required
              />
            </Field>
            <Field label="Looking for">
              <input
                className="field"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
              />
            </Field>
            <Field label="Outfit clue">
              <input
                className="field"
                value={outfitClue}
                onChange={(e) => setOutfitClue(e.target.value)}
              />
            </Field>
            <Field label="Venue zone">
              <select
                className="field"
                value={venueZone}
                onChange={(e) => setVenueZone(e.target.value as VenueZone)}
              >
                {VENUE_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={openToMeet}
                onChange={(e) => setOpenToMeet(e.target.checked)}
              />
              Open to meet
            </label>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </form>
        ) : (
          <div className="space-y-2 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 text-sm">
            {person.avatarUrl ? (
              <img
                src={person.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-[4px] object-cover"
              />
            ) : null}
            <p>{person.project}</p>
            <p className="font-mono text-xs text-[color:var(--color-text-muted)]">
              {[person.venueZone, person.outfitClue].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg tracking-tight">
          Connections ({connections.length})
        </h2>
        {connections.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-muted)]">
            Scan someone’s QR and tap “I met this person.”
          </p>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/p/${c.slug}`}
                  className="flex items-center gap-3 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-sm"
                >
                  <CursorPointer
                    color={c.cursorColor}
                    code={c.cursorCode}
                    size="sm"
                    animate={false}
                  />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {status ? (
        <p className="text-sm text-[color:var(--color-text-muted)]">{status}</p>
      ) : null}

      <button
        type="button"
        className="text-sm text-[color:var(--color-error)] underline-offset-2 hover:underline"
        onClick={() => void onDelete()}
      >
        Delete my profile
      </button>
    </div>
  );
}
