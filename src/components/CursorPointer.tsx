import type { PublicAttendee } from "../lib/types";

type Props = {
  color: string;
  code: string;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
};

const sizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-20 h-20",
  xl: "w-32 h-32",
};

export function CursorPointer({
  color,
  code,
  size = "md",
  animate = true,
  className = "",
}: Props) {
  return (
    <div
      className={`relative inline-flex items-start ${sizes[size]} ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        className={`w-full h-full drop-shadow-sm ${animate ? "cursor-drift" : ""}`}
        fill="none"
      >
        <path
          d="M5 3.5 L5 24.5 L11.2 18.8 L16.8 28.2 L20.2 26.4 L14.5 16.8 L22.5 16.2 Z"
          fill={color}
          stroke="#26251e"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute -bottom-1 -right-2 font-mono text-[10px] md:text-xs font-medium tracking-wide px-1.5 py-0.5 rounded-sm border"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border-strong)",
          color: "var(--color-text)",
        }}
      >
        {code}
      </span>
    </div>
  );
}

export function MiniCursor({ person }: { person: PublicAttendee }) {
  return (
    <CursorPointer
      color={person.cursorColor}
      code={person.cursorCode}
      size="sm"
      animate={person.isActive}
    />
  );
}
