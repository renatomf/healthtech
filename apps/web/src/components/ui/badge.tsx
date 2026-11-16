import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

const tones = {
  neutral: 'bg-surface-muted text-muted',
  info: 'bg-primary-soft text-foreground',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export function Badge({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
