import type { ReactNode } from "react";

export function CursorGlyph({
  color = "#f54e00",
  className = "",
  title,
}: {
  color?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M5 3.5 L5 24.5 L11.2 18.8 L16.8 28.2 L20.2 26.4 L14.5 16.8 L22.5 16.2 Z"
        fill={color}
        stroke="#26251e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[color:var(--color-text)]">
        {label}
        {required ? (
          <span className="text-[color:var(--color-accent)]"> *</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
