import { QRCodeCanvas } from 'qrcode.react';

export function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  return <div className="inline-flex rounded-[18px] border border-[var(--line-strong)] bg-white p-3"><QRCodeCanvas value={value} size={size} bgColor="#ffffff" fgColor="#26251e" level="M" includeMargin={false} /></div>;
}
