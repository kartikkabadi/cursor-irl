import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { ArrowUpRight, Check, CircleNotch } from '@phosphor-icons/react';

export const buttonClass = (variant: 'primary' | 'secondary' | 'ghost' = 'primary', className = '') => {
  const variants = {
    primary: 'bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent)]',
    secondary: 'bg-[var(--sand)] text-[var(--ink)] hover:bg-[var(--sand-strong)]',
    ghost: 'border border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-white/45',
  };
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold tracking-[-0.01em] transition duration-150 active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`;
};

export function Button({ variant = 'primary', loading, children, className, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; loading?: boolean }>) {
  return <button className={buttonClass(variant, className)} disabled={loading || props.disabled} {...props}>{loading ? <CircleNotch size={17} className="animate-spin" /> : null}{children}</button>;
}

export function ArrowButton({ children, className = '', loading, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }>) {
  return <Button className={className} loading={loading} {...props}>{children}<ArrowUpRight size={17} weight="bold" /></Button>;
}

export function StatusPill({ children, active = false }: PropsWithChildren<{ active?: boolean }>) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/45 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]"><span className={`h-1.5 w-1.5 rounded-full ${active ? 'soft-pulse bg-[#5C9C77]' : 'bg-[#A9A79F]'}`} />{children}</span>;
}

export function CheckMark({ children }: PropsWithChildren) {
  return <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><Check size={15} weight="bold" className="text-[#5C9C77]" />{children}</span>;
}

export function FieldLabel({ label, hint, htmlFor }: { label: string; hint?: string; htmlFor?: string }) {
  return <div className="flex items-baseline justify-between gap-3"><label htmlFor={htmlFor} className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</label>{hint ? <span className="text-[11px] text-[var(--muted)]">{hint}</span> : null}</div>;
}

export function TextInput({ error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <div className="space-y-1.5"><input className={`field-input ${error ? 'border-[#BA5A49]' : ''} ${className}`} {...props} />{error ? <p className="text-xs text-[#A94B3B]">{error}</p> : null}</div>;
}

export function TextArea({ error, className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return <div className="space-y-1.5"><textarea className={`field-input min-h-28 resize-y ${error ? 'border-[#BA5A49]' : ''} ${className}`} {...props} />{error ? <p className="text-xs text-[#A94B3B]">{error}</p> : null}</div>;
}
