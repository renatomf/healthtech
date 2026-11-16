import { formatClinicDateTime, type PatientAppointmentResponse } from '@healthtech/shared';
import { CalendarClock, ChevronRight, FileCheck2, FileClock } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/badge.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Empty, ErrorMessage, Loading } from '../../components/ui/states.tsx';
import { cn } from '../../lib/cn.ts';
import { errorMessage } from '../../lib/messages.ts';
import { useMe } from '../auth/use-auth.ts';
import { useMyAppointments } from './queries.ts';

// Situações exibidas ao paciente (INTERPRETACOES.md #6 e #7).
function Situation({ appointment }: { appointment: PatientAppointmentResponse }) {
  if (appointment.status === 'CANCELED') return <Badge tone="danger">Cancelado</Badge>;
  if (appointment.hasPublishedReport) return <Badge tone="success">Laudo disponível</Badge>;
  return <Badge tone="info">Agendado</Badge>;
}

export function PatientHome() {
  const me = useMe();
  const appointments = useMyAppointments();
  const firstName = me.data?.name.split(' ')[0];

  const list = appointments.data ?? [];
  const now = Date.now();
  const next = list
    .filter((a) => a.status === 'SCHEDULED' && new Date(a.scheduledAt).getTime() > now)
    .at(-1); // a lista vem do mais recente para o mais antigo

  return (
    <div className="space-y-8">
      <div className="pt-4">
        <h1 className="text-4xl font-light tracking-tight">Olá, {firstName}!</h1>
        <p className="mt-1 text-muted">Acompanhe seus exames e laudos.</p>
      </div>

      {appointments.isPending && <Loading />}
      {appointments.isError && <ErrorMessage>{errorMessage(appointments.error)}</ErrorMessage>}

      {next && (
        <section
          aria-labelledby="next-title"
          className="rounded-3xl bg-primary p-6 text-primary-foreground"
        >
          <p id="next-title" className="text-sm opacity-90">
            Próximo exame
          </p>
          <p className="mt-2 text-2xl font-light tracking-tight">{next.examType.name}</p>
          <p className="mt-4 flex items-center gap-2 first-letter:uppercase">
            <CalendarClock className="size-4" aria-hidden />
            {formatClinicDateTime(next.scheduledAt, "EEEE, d 'de' MMMM 'às' HH:mm")}
          </p>
          <p className="mt-1 text-xs opacity-80">Horário de Brasília</p>
        </section>
      )}

      {appointments.isSuccess && (
        <section aria-labelledby="exams-title" className="space-y-3">
          <h2 id="exams-title" className="text-lg font-medium">
            Meus exames
          </h2>
          {list.length === 0 && (
            <Card>
              <Empty>Você ainda não tem exames agendados.</Empty>
            </Card>
          )}
          <ul className="space-y-3">
            {list.map((a) => {
              const content = (
                <>
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-2xl',
                      a.hasPublishedReport
                        ? 'bg-success-soft text-success'
                        : 'bg-primary-soft text-link',
                    )}
                  >
                    {a.hasPublishedReport ? (
                      <FileCheck2 className="size-5" aria-hidden />
                    ) : (
                      <FileClock className="size-5" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{a.examType.name}</span>
                    <span className="block text-sm text-muted">
                      {formatClinicDateTime(a.scheduledAt)}
                    </span>
                    <span className="mt-2 block">
                      <Situation appointment={a} />
                    </span>
                  </span>
                </>
              );
              const box = 'flex items-center gap-4 rounded-3xl border border-border bg-surface p-4';
              return (
                <li key={a.id}>
                  {a.hasPublishedReport ? (
                    <Link
                      to={`/paciente/exames/${a.id}/laudo`}
                      aria-label={`Ler laudo de ${a.examType.name}, ${formatClinicDateTime(a.scheduledAt)}`}
                      className={cn(box, 'transition hover:bg-surface-muted')}
                    >
                      {content}
                      <ChevronRight className="size-4 text-muted" aria-hidden />
                    </Link>
                  ) : (
                    <div className={box}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="px-2 text-xs text-muted">Datas e horários no horário de Brasília.</p>
        </section>
      )}
    </div>
  );
}
