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
    <div className="grid min-h-dvh gap-3 p-3 lg:h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden rounded-4xl bg-linear-to-b from-hero-from to-hero-to p-10 text-white lg:flex">
        <Brand inverted />
        <div className="space-y-6">
          <h1 className="max-w-2xl text-5xl leading-[1.05] font-light tracking-tight xl:text-6xl">
            Exames agendados.
            <br />
            Laudos no lugar certo.
          </h1>
          <p className="max-w-sm text-sm leading-relaxed">
            A clínica agenda e publica; o paciente acompanha seus exames e lê os laudos assim que
            ficam prontos.
          </p>
        </div>
        <p className="text-xs">Horários exibidos no horário de Brasília.</p>
      </aside>

      <main className="flex flex-col rounded-4xl bg-surface p-6 sm:p-8 lg:min-h-0 lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="lg:invisible">
            <Brand />
          </span>
          <ThemeToggle />
        </div>

        <div className="m-auto w-full max-w-sm space-y-7 py-2">
          <div className="space-y-3">
            <h2 className="text-4xl font-light tracking-tight">Entrar</h2>
            <p className="text-sm text-muted">Use o e-mail e a senha da sua conta.</p>
          </div>

          <form
            noValidate
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
            className="space-y-5"
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

          <div className="rounded-3xl bg-surface-muted px-5 py-4 text-[13px]">
            <p>Contas de demonstração</p>
            <p className="mb-2 text-muted">Senha de todas: Demo@1234</p>
            <ul className="divide-y divide-border">
              {DEMO.map(([label, email]) => (
                <li key={email} className="flex justify-between gap-4 py-1.5">
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
