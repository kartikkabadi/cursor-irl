import { CursorGlyph } from "./ui";

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
      <CursorGlyph
        color={color}
        className={`w-full h-full drop-shadow-sm ${animate ? "cursor-drift" : ""}`}
      />
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
