import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  soft: 'bg-primary-soft text-foreground hover:brightness-95 dark:hover:brightness-125',
  outline: 'bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted',
  ghost: 'text-muted hover:bg-surface-muted hover:text-foreground',
  danger: 'bg-danger-soft text-danger hover:brightness-95 dark:hover:brightness-125',
};

type Variant = keyof typeof variants;
type Size = 'sm' | 'md';

/** Classes do botão, também usadas em <Link> com cara de botão. */
export function buttonClasses(variant: Variant = 'primary', size: Size = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full transition',
    'disabled:pointer-events-none disabled:opacity-50',
    size === 'md' ? 'h-11 px-6 text-sm' : 'h-9 px-4 text-[13px]',
    variants[variant],
  );
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, ...props }: Props) {
  return (
    <button type="button" className={cn(buttonClasses(variant, size), className)} {...props} />
  );
}
