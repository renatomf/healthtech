import { Link, Outlet } from 'react-router';
import { Brand } from '../../components/brand.tsx';
import { UserMenu } from '../../components/user-menu.tsx';

export function PatientLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-3 pb-12">
      {/* Barra flutuante em pílula, como a navegação do DocShield. */}
      <header className="sticky top-3 z-10 mt-3 flex items-center justify-between rounded-full bg-surface/90 py-2 pr-2 pl-5 ring-1 ring-border backdrop-blur">
        <Link to="/paciente">
          <Brand />
        </Link>
        <UserMenu />
      </header>
      <main className="px-1 pt-10">
        <Outlet />
      </main>
    </div>
  );
}
