import { CalendarDays, Plus } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Brand } from '../../components/brand.tsx';
import { type MenuLink, UserMenu } from '../../components/user-menu.tsx';
import { cn } from '../../lib/cn.ts';

const NEW_APPOINTMENT = '/clinica/agendamentos/novo';

const NAV: MenuLink[] = [
  { to: '/clinica', label: 'Agenda', icon: CalendarDays, end: true },
  { to: NEW_APPOINTMENT, label: 'Novo agendamento', icon: Plus },
];

export function ClinicLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh lg:grid lg:h-dvh lg:grid-cols-[16rem_1fr]">
      <aside className="hidden flex-col border-r border-border bg-surface p-6 lg:flex">
        <Brand />
        <nav aria-label="Principal" className="mt-12 flex flex-col gap-1">
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
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-dvh flex-col lg:min-h-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:static lg:justify-end lg:px-8 lg:py-2">
          <span className="lg:hidden">
            <Brand />
          </span>
          <UserMenu links={NAV} />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:min-h-0 lg:overflow-y-auto lg:p-8">
          <Outlet />
        </main>
      </div>

      {pathname !== NEW_APPOINTMENT && (
        <Link
          to={NEW_APPOINTMENT}
          aria-label="Novo agendamento"
          className="fixed right-5 bottom-5 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_rgb(69_102_192/0.45)] lg:hidden"
        >
          <Plus className="size-6" strokeWidth={1.5} aria-hidden />
        </Link>
      )}
    </div>
  );
}
