import { LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { Brand, ThemeToggle } from '../../components/brand.tsx';
import { useLogout } from '../auth/use-auth.ts';

export function PatientLayout() {
  const logout = useLogout();
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-12 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <Link to="/paciente" aria-label="Início">
          <Brand />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
