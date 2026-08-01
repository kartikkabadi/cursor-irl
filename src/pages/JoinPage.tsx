import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createAttendee } from "../lib/api";
import { saveSession } from "../lib/storage";
import { VENUE_ZONES, type VenueZone } from "../lib/types";
import { CursorPointer } from "../components/CursorPointer";
import { Field } from "../components/ui";

const PREVIEW_COLORS = ["#f54e00", "#c0a8dd", "#9fbbe0", "#9fc9a2"];

export function JoinPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [project, setProject] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [outfitClue, setOutfitClue] = useState("");
  const [venueZone, setVenueZone] = useState<VenueZone>("Workshop");
  const [openToMeet, setOpenToMeet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "preview">("form");

  const previewColor = useMemo(
    () => PREVIEW_COLORS[name.length % PREVIEW_COLORS.length]!,
    [name.length],
  );
  const previewCode = useMemo(() => {
    const letters = (name || "XX").replace(/[^a-zA-Z]/g, "").toUpperCase();
    return `${letters[0] ?? "X"}${letters[1] ?? "Y"}`;
  }, [name]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === "form") {
      setStep("preview");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createAttendee({
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
      saveSession({
        attendeeId: result.attendee.id,
        slug: result.attendee.slug,
        editToken: result.editToken,
      });
      navigate(`/me`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
          Join the room
        </p>
        <h1 className="mt-2 text-3xl tracking-tight">Declare yourself</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
          No accounts. You’ll get a secret edit token saved on this device.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {step === "form" ? (
          <>
            <Field label="Name" required>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="Deepak"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="X handle">
                <input
                  className="field"
                  value={xHandle}
                  onChange={(e) => setXHandle(e.target.value)}
                  placeholder="@handle"
                  maxLength={40}
                />
              </Field>
              <Field label="GitHub handle">
                <input
                  className="field"
                  value={githubHandle}
                  onChange={(e) => setGithubHandle(e.target.value)}
                  placeholder="username"
                  maxLength={40}
                />
              </Field>
            </div>
            <Field label="Avatar / photo URL">
              <input
                className="field"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                type="url"
              />
            </Field>
            <Field label="What are you building?" required>
              <input
                className="field"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                required
                maxLength={200}
                placeholder="Autonomous developer agents"
              />
            </Field>
            <Field label="Who do you want to meet?">
              <input
                className="field"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                maxLength={200}
                placeholder="Collaborators shipping agents"
              />
            </Field>
            <Field label="Outfit / find-me clue">
              <input
                className="field"
                value={outfitClue}
                onChange={(e) => setOutfitClue(e.target.value)}
                maxLength={160}
                placeholder="Black shirt, front-left tables"
              />
            </Field>
            <Field label="Venue zone" required>
              <select
                className="field"
                value={venueZone}
                onChange={(e) => setVenueZone(e.target.value as VenueZone)}
              >
                {VENUE_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-3 rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={openToMeet}
                onChange={(e) => setOpenToMeet(e.target.checked)}
                className="size-4 accent-[color:var(--color-accent)]"
              />
              Open to meeting right now
            </label>
          </>
        ) : (
          <div className="rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                  Profile preview
                </p>
                <h2 className="mt-2 text-2xl tracking-tight">{name || "You"}</h2>
                <p className="mt-2 text-sm">{project}</p>
                <p className="mt-3 font-mono text-xs text-[color:var(--color-text-muted)]">
                  {[venueZone, outfitClue].filter(Boolean).join(" · ")}
                </p>
              </div>
              <CursorPointer color={previewColor} code={previewCode} size="lg" />
            </div>
            <p className="mt-5 text-sm text-[color:var(--color-text-muted)]">
              Your final cursor color + code are assigned when you publish.
            </p>
          </div>
        )}

        {error ? (
          <p className="text-sm text-[color:var(--color-error)]">{error}</p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {step === "preview" ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep("form")}
            >
              Back
            </button>
          ) : null}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {step === "form"
              ? "Preview profile"
              : submitting
                ? "Publishing…"
                : "Publish to the room"}
          </button>
          <Link to="/" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
