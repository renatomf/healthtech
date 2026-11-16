import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

interface Props extends HTMLAttributes<HTMLElement> {
  padded?: boolean;
}

export function Card({ className, padded = true, ...props }: Props) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-border bg-surface shadow-[0_1px_3px_rgb(11_26_74/0.05)]',
        padded && 'p-6',
        className,
      )}
      {...props}
    />
  );
}
