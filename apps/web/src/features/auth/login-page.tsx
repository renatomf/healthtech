import { loginRequest } from '@healthtech/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Brand, ThemeToggle } from '../../components/brand.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Field, Input } from '../../components/ui/field.tsx';
import { ErrorMessage } from '../../components/ui/states.tsx';
import { errorMessage } from '../../lib/messages.ts';
import { useLogin } from './use-auth.ts';

type Form = z.input<typeof loginRequest>;

const DEMO = [
  ['Equipe da clínica', 'clinica@demo.local'],
  ['Paciente', 'joao@demo.local'],
  ['Paciente', 'maria@demo.local'],
];

export function LoginPage() {
  const login = useLogin();
  const form = useForm<Form, unknown, z.output<typeof loginRequest>>({
    resolver: zodResolver(loginRequest),
  });
  const { errors } = form.formState;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-linear-to-b from-hero-from to-hero-to p-12 lg:flex">
        <Brand />
        <div className="space-y-4">
          <h1 className="max-w-md text-5xl leading-tight font-light tracking-tight">
            Exames agendados, laudos no lugar certo.
          </h1>
          <p className="max-w-sm text-muted">
            A clínica agenda e publica; o paciente acompanha seus exames e lê os laudos assim que
            ficam prontos.
          </p>
        </div>
        <p className="text-xs text-muted">Horários exibidos no horário de Brasília.</p>
      </aside>

      <main className="flex flex-col p-6 sm:p-12">
        <div className="flex items-center justify-between">
          <span className="lg:invisible">
            <Brand />
          </span>
          <ThemeToggle />
        </div>

        <div className="m-auto w-full max-w-sm space-y-8 py-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-light tracking-tight">Entrar</h2>
            <p className="text-sm text-muted">Use o e-mail e a senha da sua conta.</p>
          </div>

          <form
            noValidate
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
            className="space-y-4"
          >
            <Field label="E-mail" error={errors.email && 'Informe um e-mail válido.'}>
              {(p) => (
                <Input {...p} type="email" autoComplete="username" {...form.register('email')} />
              )}
            </Field>
            <Field label="Senha" error={errors.password && 'Informe a senha.'}>
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  autoComplete="current-password"
                  {...form.register('password')}
                />
              )}
            </Field>
            {login.isError && <ErrorMessage>{errorMessage(login.error)}</ErrorMessage>}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <div className="rounded-3xl bg-surface-muted p-5 text-sm">
            <p className="font-medium">Contas de demonstração</p>
            <p className="mb-3 text-muted">Senha de todas: Demo@1234</p>
            <ul className="space-y-1">
              {DEMO.map(([label, email]) => (
                <li key={email} className="flex justify-between gap-4">
                  <span className="text-muted">{label}</span>
                  <span>{email}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
