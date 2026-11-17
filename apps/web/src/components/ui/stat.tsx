import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

/**
 * Indicador com número grande e leve (estilo DocShield).
 * Celular: uma linha (ícone + rótulo à esquerda, número à direita). Desktop: empilhado.
 */
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
    <div className="flex h-full items-center gap-3 sm:flex-col sm:items-start sm:gap-4">
      {icon && (
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full ring-1',
            inverted ? 'bg-white/15 text-white ring-white/30' : 'bg-surface text-link ring-border',
          )}
        >
          {icon}
        </span>
      )}
      <div className="flex flex-1 items-center justify-between gap-3 sm:block">
        <p
          className={cn(
            'order-2 text-3xl font-light tracking-tight tabular-nums sm:text-4xl',
            'sm:order-none',
          )}
        >
          {value}
        </p>
        <p className={cn('order-1 text-[13px] sm:mt-1', inverted ? 'text-white' : 'text-muted')}>
          {label}
        </p>
      </div>
    </div>
  );
}
