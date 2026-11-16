import { Moon, Shield, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';
import { useTheme } from '../lib/theme.ts';

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 text-xl font-light tracking-tight',
        inverted && 'text-white',
      )}
    >
      <Shield className="size-5" strokeWidth={1.5} aria-hidden />
      HealthTech
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      className="grid size-10 place-items-center rounded-full bg-surface-muted text-muted transition hover:text-foreground"
    >
      {dark ? (
        <Sun className="size-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Moon className="size-4" strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}

/** Título no estilo DocShield: primeira parte forte, continuação em cinza. */
export function Heading({
  children,
  tail,
  className,
}: {
  children: ReactNode;
  tail?: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={cn('text-4xl leading-[1.1] font-light tracking-tight sm:text-5xl', className)}>
      {children}
      {tail && <span className="block text-muted first-letter:uppercase">{tail}</span>}
    </h1>
  );
}
