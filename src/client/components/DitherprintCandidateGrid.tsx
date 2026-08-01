import type { DitherprintIdentity } from '../../shared/ditherprint';
import { ditherprintSvg } from '../../shared/ditherprint';
import { DitherprintAvatar } from './DitherprintAvatar';

type DitherprintCandidateGridProps = {
  candidates: DitherprintIdentity[];
  selectedVariant: number | null;
  onSelect: (variant: number) => void;
  disabled?: boolean;
};

export function DitherprintCandidateGrid({ candidates, selectedVariant, onSelect, disabled = false }: DitherprintCandidateGridProps) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Choose an identity">
    {candidates.map((candidate) => {
      const selected = selectedVariant === candidate.variant;
      return <button
        key={candidate.variant}
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={() => onSelect(candidate.variant)}
        className={`group relative flex min-h-[132px] flex-col items-center justify-center gap-3 border px-3 py-4 text-center transition duration-150 ${selected ? 'border-[var(--ink)] bg-white/70 shadow-[0_0_0_3px_rgba(38,37,30,.1)]' : 'border-[var(--line-strong)] bg-white/35 hover:border-[var(--ink)]'}`}
      >
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(ditherprintSvg(candidate, 96))}`}
          width={96}
          height={96}
          alt=""
          className={selected ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}
          style={{ shapeRendering: 'crispEdges' }}
          draggable={false}
        />
        <span className="flex items-baseline gap-2 font-mono text-[11px]">
          <span className="font-bold tracking-[0.08em]">{candidate.fingerprint}</span>
          <span className="text-[var(--muted)]">0{candidate.variant + 1}</span>
        </span>
      </button>;
    })}
  </div>;
}

export function DitherprintPreview({ identity, size = 160 }: { identity: DitherprintIdentity; size?: number }) {
  return <div className="inline-block border border-[var(--line-strong)] bg-white p-3">
    <DitherprintAvatar profileId={identity.profile_id} variant={identity.variant} identity={identity} size={size} />
  </div>;
}
