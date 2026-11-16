import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

const tones = {
  surface: 'bg-surface',
  muted: 'bg-surface-muted',
  hero: 'bg-linear-to-b from-hero-from to-hero-to text-white',
};

interface Props extends HTMLAttributes<HTMLElement> {
  padded?: boolean;
  tone?: keyof typeof tones;
}

export function Card({ className, padded = true, tone = 'surface', ...props }: Props) {
  return (
    <section
      className={cn('rounded-4xl', tones[tone], padded && 'p-6 sm:p-8', className)}
      {...props}
    />
  );
}
