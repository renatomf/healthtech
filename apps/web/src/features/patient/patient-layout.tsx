import { LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { Brand, ThemeToggle } from '../../components/brand.tsx';
import { useLogout } from '../auth/use-auth.ts';

export function PatientLayout() {
  const logout = useLogout();
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-3 pb-12">
      {/* Barra flutuante em pílula, como a navegação do DocShield. */}
      <header className="sticky top-3 z-10 mt-3 flex items-center justify-between rounded-full bg-surface/90 py-2 pr-2 pl-5 ring-1 ring-border backdrop-blur">
        <Link to="/paciente">
          <Brand />
        </Link>
        <div className="flex items-center gap-1">
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
      </header>
      <main className="px-1 pt-10">
        <Outlet />
      </main>
    </div>
  );
}
