import { useEffect, useState } from 'react';
import type { DitherprintIdentity } from '../../shared/ditherprint';
import { ditherprintSvg, generateDitherprintIdentity } from '../../shared/ditherprint';

type DitherprintAvatarProps = {
  profileId: string;
  variant: number;
  size?: number;
  identity?: DitherprintIdentity;
  className?: string;
  rounded?: boolean;
  label?: string;
};

export function DitherprintAvatar({ profileId, variant, size = 96, identity, className = '', rounded = false, label }: DitherprintAvatarProps) {
  const [derived, setDerived] = useState<DitherprintIdentity | null>(null);
  const ready = identity ?? derived;

  useEffect(() => {
    if (identity) return;
    let cancelled = false;
    void generateDitherprintIdentity(profileId, variant).then((result) => {
      if (!cancelled) setDerived(result);
    });
    return () => { cancelled = true; };
  }, [profileId, variant, identity]);

  if (!ready) return <div style={{ width: size, height: size }} className="skeleton-square" role="img" aria-label={label ?? 'Identity loading'} />;
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ditherprintSvg(ready, size))}`;
  return <img
    src={src}
    width={size}
    height={size}
    alt={label ?? `Ditherprint ${ready.fingerprint}`}
    className={`${rounded ? 'rounded-[16px]' : ''} ${className}`}
    style={{ shapeRendering: 'crispEdges', display: 'block' }}
    draggable={false}
  />;
}
