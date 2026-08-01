import { useEffect, useState } from 'react';
import { DownloadSimple, XLogo } from '@phosphor-icons/react';
import type { DitherprintIdentity } from '../../shared/ditherprint';
import { ditherprintSvg, generateDitherprintIdentity } from '../../shared/ditherprint';
import type { Attendee } from '../../shared/attendee';
import { Button, buttonClass } from './ui';

const CARD_W = 1200;
const CARD_H = 630;

function wrap(text: string, width = 38): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      if (line) lines.push(line.trim());
      line = word;
    } else {
      line += (line ? ' ' : '') + word;
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 4);
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function shareCardSvg(attendee: Attendee, identity: DitherprintIdentity, url: string): string {
  const artSize = 340;
  const artX = 88;
  const artY = 120;
  const textX = 520;
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  // Keep the value XML-safe: this string is inserted into quoted SVG
  // attributes, so embedded double quotes would make the preview invalid.
  const sans = 'Avenir Next, Helvetica Neue, Arial, sans-serif';
  const projectLines = wrap(attendee.project, 34).map(escapeXml);
  const clueLines = (attendee.outfit_clue ?? '').split('\n')[0].slice(0, 140);
  const clue = wrap(clueLines, 40).map(escapeXml);
  const zone = escapeXml(attendee.venue_zone ?? 'Somewhere in the room');

  const elements: string[] = [];
  elements.push(`<rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" fill="#F7F7F4"/>`);
  elements.push(`<rect x="0" y="0" width="${CARD_W}" height="14" fill="#26251E"/>`);
  elements.push(`<rect x="0" y="${CARD_H - 14}" width="${CARD_W}" height="14" fill="#F54E00"/>`);

  elements.push(`<rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" fill="#FFFFFF" stroke="#26251E" stroke-width="3"/>`);
  elements.push(ditherprintSvg(identity, artSize).replace('<svg ', `<svg x="${artX}" y="${artY}" `));
  elements.push(`<text x="${artX}" y="${artY + artSize + 54}" font-family="${mono}" font-size="34" font-weight="700" letter-spacing="6" fill="#26251E">${escapeXml(identity.fingerprint)}</text>`);
  elements.push(`<text x="${artX + 8}" y="${artY + artSize + 96}" font-family="${mono}" font-size="20" letter-spacing="3" fill="#6D6B62">CURSOR ROADSHOW / BANGALORE</text>`);

  const name = attendee.name.trim().slice(0, 24);
  const nameNeedsCompression = name.length > 14;
  elements.push(`<text x="${textX}" y="150" font-family="${sans}" font-weight="700" font-size="76" letter-spacing="-3" fill="#26251E"${nameNeedsCompression ? ' textLength="590" lengthAdjust="spacingAndGlyphs"' : ''}>${escapeXml(name)}</text>`);
  elements.push(`<text x="${textX}" y="150" font-family="${sans}" font-weight="700" font-size="76" letter-spacing="-3" fill="#F54E00">.</text>`);
  elements.push(`<text x="${textX}" y="240" font-family="${sans}" font-size="32" letter-spacing="-0.5" fill="#26251E">Building:</text>`);
  projectLines.forEach((line, index) => {
    elements.push(`<text x="${textX}" y="${286 + index * 46}" font-family="${sans}" font-size="34" letter-spacing="-0.5" font-weight="600" fill="#26251E">${line}</text>`);
  });
  const clueTop = 286 + Math.max(projectLines.length, 1) * 46;
  elements.push(`<text x="${textX}" y="${clueTop + 26}" font-family="${sans}" font-size="24" letter-spacing="-0.3" fill="#6D6B62">Find me: ${zone}</text>`);
  clue.forEach((line, index) => {
    elements.push(`<text x="${textX}" y="${clueTop + 66 + index * 34}" font-family="${sans}" font-size="24" letter-spacing="-0.3" fill="#6D6B62">${line}</text>`);
  });
  elements.push(`<text x="${textX}" y="${CARD_H - 96}" font-family="${mono}" font-size="20" letter-spacing="0.4" fill="#F54E00" textLength="590" lengthAdjust="spacingAndGlyphs">${escapeXml(url)}</text>`);
  elements.push(`<text x="${textX}" y="${CARD_H - 48}" font-family="${sans}" font-size="18" fill="#6D6B62">Turn handles into handshakes.</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">${elements.join('')}</svg>`;
}

export function downloadShareCard(svg: string, filename = 'cursor-irl-card.svg') {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export function ShareCard({ attendee, url, shareText }: { attendee: Attendee; url: string; shareText?: string }) {
  const [identity, setIdentity] = useState<DitherprintIdentity | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    void generateDitherprintIdentity(attendee.id, attendee.avatar_variant).then((result) => {
      if (!cancelled) setIdentity(result);
    });
    return () => { cancelled = true; };
  }, [attendee.id, attendee.avatar_variant]);

  if (!identity) return <div className="skeleton-square min-h-[260px]" />;

  const svg = shareCardSvg(attendee, identity, url);
  const postText = shareText ?? `I'm at Cursor Roadshow Bangalore. Building: ${attendee.project} Come say hi: ${url}`;
  const postUrl = `https://x.com/intent/post?text=${encodeURIComponent(postText)}`;

  return <div className="space-y-4">
    <div
      role="img"
      aria-label={`Share card for ${attendee.name}`}
      className="overflow-hidden border border-[var(--line-strong)] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-[var(--muted)]">Download the 1200 × 630 card, then attach it to your X post. The button pre-fills the text and profile link.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={() => { downloadShareCard(shareCardSvg(attendee, identity, url), `cursor-irl-${attendee.slug}.svg`); setNotice('Card downloaded.'); }}>
          <DownloadSimple size={16} /> Download card
        </Button>
        <a href={postUrl} target="_blank" rel="noreferrer" className={buttonClass('primary')}><XLogo size={16} /> Post on X</a>
      </div>
    </div>
    {notice ? <p className="text-xs font-semibold text-[#2F7D64]">{notice}</p> : null}
  </div>;
}
