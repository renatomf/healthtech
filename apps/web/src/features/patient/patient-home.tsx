import { Brand, ThemeToggle } from '../../components/brand.tsx';
import { Card } from '../../components/ui/card.tsx';
import { useLogout, useMe } from '../auth/use-auth.ts';

// Telas do paciente (lista e leitura de laudo) entram na próxima etapa do plano.
export function PatientHome() {
  const me = useMe();
  const logout = useLogout();
  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Brand />
        <ThemeToggle />
      </div>
      <Card>
        <h1 className="text-2xl font-light tracking-tight">Olá, {me.data?.name}</h1>
        <p className="mt-2 text-sm text-muted">A área do paciente está em construção.</p>
        <button type="button" onClick={() => logout.mutate()} className="mt-4 text-sm text-link">
          Sair
        </button>
      </Card>
    </main>
  );
}
