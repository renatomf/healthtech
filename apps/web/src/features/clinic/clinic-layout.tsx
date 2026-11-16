import { CalendarDays, LogOut, Plus } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { Brand, ThemeToggle } from '../../components/brand.tsx';
import { cn } from '../../lib/cn.ts';
import { useLogout, useMe } from '../auth/use-auth.ts';

const NAV = [
  { to: '/clinica', label: 'Agenda', icon: CalendarDays, end: true },
  { to: '/clinica/agendamentos/novo', label: 'Novo agendamento', icon: Plus, end: false },
];

export function ClinicLayout() {
  const me = useMe();
  const logout = useLogout();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 lg:sticky lg:top-0 lg:h-dvh lg:flex-col lg:items-stretch lg:justify-start lg:border-r lg:border-b-0 lg:p-6">
        <Brand />
        <nav aria-label="Principal" className="flex gap-1 lg:mt-12 lg:flex-col">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition',
                  isActive
                    ? 'bg-primary-soft text-foreground'
                    : 'text-muted hover:bg-surface-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" strokeWidth={1.5} aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch">
          <div className="hidden rounded-3xl bg-surface-muted p-4 lg:block">
            <p className="text-sm">{me.data?.name}</p>
            <p className="truncate text-xs text-muted">{me.data?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout.mutate()}
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
              Sair
            </button>
          </div>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
