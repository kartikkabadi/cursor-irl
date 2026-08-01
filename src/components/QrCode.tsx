import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function QrCode({ value, label, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    let cancelled = false;
    QRCode.toCanvas(canvas, value, {
      width: 220,
      margin: 1,
      color: { dark: "#26251e", light: "#f7f7f4" },
    }).catch((err: unknown) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "QR failed");
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
      />
      {label ? (
        <p className="font-mono text-xs text-[color:var(--color-text-muted)]">
          {label}
        </p>
      ) : null}
      {error ? <p className="text-sm text-[color:var(--color-error)]">{error}</p> : null}
    </div>
  );
}
