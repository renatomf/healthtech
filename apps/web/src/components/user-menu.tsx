import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { type ComponentType, useRef } from 'react';
import { NavLink } from 'react-router';
import { useLogout, useMe } from '../features/auth/use-auth.ts';
import { cn } from '../lib/cn.ts';
import { useTheme } from '../lib/theme.ts';
import { ThemeToggle } from './brand.tsx';

export interface MenuLink {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  end?: boolean;
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')
  ).toUpperCase();
}

function Avatar({ name }: { name?: string }) {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground"
    >
      {initials(name)}
    </span>
  );
}

/**
 * Dados de quem está logado + tema + sair.
 * Desktop: tudo na barra. Celular: botão de menu que abre um popover nativo
 * (fecha com Esc ou clique fora), com os links de navegação junto.
 */
export function UserMenu({ links = [] }: { links?: MenuLink[] }) {
  const me = useMe();
  const logout = useLogout();
  const { theme, toggle } = useTheme();
  const popover = useRef<HTMLDivElement>(null);
  const close = () => popover.current?.hidePopover();
  const dark = theme === 'dark';

  return (
    <>
      <div className="hidden items-center gap-2 lg:flex">
        <div className="flex items-center gap-3 rounded-full bg-surface-muted py-1 pr-5 pl-1">
          <Avatar name={me.data?.name} />
          <span className="leading-tight">
            <span className="block text-sm">{me.data?.name}</span>
            <span className="block text-xs text-muted">{me.data?.email}</span>
          </span>
        </div>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="flex h-10 items-center gap-2 rounded-full px-4 text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
          Sair
        </button>
      </div>

      <button
        type="button"
        popoverTarget="user-menu"
        aria-label="Abrir menu"
        className="grid size-10 place-items-center rounded-full bg-foreground text-background lg:hidden"
      >
        <Menu className="size-4" strokeWidth={1.5} aria-hidden />
      </button>
      <div
        ref={popover}
        id="user-menu"
        popover="auto"
        className="fixed inset-x-3 top-18 bottom-auto m-0 w-auto rounded-4xl bg-surface p-4 text-foreground shadow-[0_20px_60px_rgb(11_22_56/0.18)] ring-1 ring-border lg:hidden"
      >
        <div className="flex items-center gap-3 rounded-3xl bg-surface-muted p-3">
          <Avatar name={me.data?.name} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm">{me.data?.name}</span>
            <span className="block truncate text-xs text-muted">{me.data?.email}</span>
          </span>
        </div>
        {links.length > 0 && (
          <nav aria-label="Menu" className="mt-2 flex flex-col">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={close}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-full px-4 py-3 text-sm',
                    isActive ? 'bg-primary-soft' : 'text-muted',
                  )
                }
              >
                <Icon className="size-4" strokeWidth={1.5} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="mt-2 flex flex-col border-t border-border pt-2">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-3 rounded-full px-4 py-3 text-sm text-muted"
          >
            {dark ? (
              <Sun className="size-4" strokeWidth={1.5} aria-hidden />
            ) : (
              <Moon className="size-4" strokeWidth={1.5} aria-hidden />
            )}
            {dark ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              logout.mutate();
            }}
            className="flex items-center gap-3 rounded-full px-4 py-3 text-sm text-muted"
          >
            <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
