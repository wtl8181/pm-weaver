import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ children, className, variant = 'ghost', ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'border-accent bg-accent text-slate-950 hover:bg-emerald-300',
        variant === 'ghost' && 'border-line bg-elevated text-slate-100 hover:border-slate-500 hover:bg-slate-800',
        variant === 'danger' && 'border-danger/40 bg-danger/10 text-red-200 hover:bg-danger/20',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
