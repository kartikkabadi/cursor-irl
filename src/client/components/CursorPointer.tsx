import { motion, useReducedMotion } from 'framer-motion';

type CursorPointerProps = {
  color: string;
  code?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
};

const sizes = {
  sm: { width: 42, height: 50, label: 'text-[9px]', offset: 8 },
  md: { width: 74, height: 86, label: 'text-[11px]', offset: 13 },
  lg: { width: 132, height: 154, label: 'text-xl', offset: 22 },
};

export function CursorPointer({ color, code, size = 'md', animated = true, className = '' }: CursorPointerProps) {
  const reducedMotion = useReducedMotion();
  const metrics = sizes[size];
  const inner = (
    <svg width={metrics.width} height={metrics.height} viewBox="0 0 132 154" fill="none" aria-hidden="true" className={className}>
      <path d="M8 4.5L124.5 66.1L72.8 78.1L54.7 137.9L38.9 132.1L57.5 72.5L8 4.5Z" fill={color} stroke="#26251e" strokeWidth="3" strokeLinejoin="round" />
      {code ? <text x="75" y="62" fill="#26251e" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="18" fontWeight="700" textAnchor="middle">{code}</text> : null}
    </svg>
  );

  if (!animated || reducedMotion) return inner;
  return (
    <motion.div
      animate={{ y: [0, -5, 0], rotate: [0, 1.5, 0] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: `${metrics.offset}px ${metrics.offset}px` }}
      className="will-change-transform"
    >
      {inner}
    </motion.div>
  );
}
