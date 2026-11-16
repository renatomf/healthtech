import { Moon, ShieldPlus, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme.ts';

export function Brand() {
  return (
    <span className="flex items-center gap-2.5 text-lg tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <ShieldPlus className="size-5" aria-hidden />
      </span>
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
      className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted hover:text-foreground"
    >
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
