import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

/** Número grande e leve com rótulo pequeno (estilo dos indicadores do DocShield). */
export function Stat({
  value,
  label,
  icon,
  inverted = false,
}: {
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  inverted?: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-6">
      {icon && (
        <span
          className={cn(
            'grid size-10 place-items-center rounded-full ring-1',
            inverted ? 'bg-white/15 text-white ring-white/30' : 'bg-surface text-link ring-border',
          )}
        >
          {icon}
        </span>
      )}
      <div>
        <p className="text-5xl font-light tracking-tight tabular-nums">{value}</p>
        <p className={cn('mt-1 text-[13px]', inverted ? 'text-white' : 'text-muted')}>{label}</p>
      </div>
    </div>
  );
}
