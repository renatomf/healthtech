import { formatClinicDateTime, type PatientAppointmentResponse } from '@healthtech/shared';
import { ArrowRight, CalendarClock, FileCheck2, FileClock } from 'lucide-react';
import { Link } from 'react-router';
import { Heading } from '../../components/brand.tsx';
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
    <div className="space-y-10">
      <Heading tail="seus exames e laudos.">Olá, {firstName}!</Heading>

      {appointments.isPending && <Loading />}
      {appointments.isError && <ErrorMessage>{errorMessage(appointments.error)}</ErrorMessage>}

      {next && (
        <Card tone="hero" aria-labelledby="next-title" className="min-h-56 space-y-10">
          <p id="next-title" className="text-sm">
            Próximo exame
          </p>
          <div>
            <p className="text-4xl leading-tight font-light tracking-tight">{next.examType.name}</p>
            <p className="mt-3 flex items-center gap-2 first-letter:uppercase">
              <CalendarClock className="size-4" strokeWidth={1.5} aria-hidden />
              {formatClinicDateTime(next.scheduledAt, "EEEE, d 'de' MMMM 'às' HH:mm")}
            </p>
            <p className="mt-1 text-xs">Horário de Brasília</p>
          </div>
        </Card>
      )}

      {appointments.isSuccess && (
        <section aria-labelledby="exams-title" className="space-y-4">
          <h2 id="exams-title" className="text-2xl font-light tracking-tight">
            Meus exames
          </h2>
          {list.length === 0 && (
            <Card>
              <Empty>Você ainda não tem exames agendados.</Empty>
            </Card>
          )}
          <ul className="space-y-2">
            {list.map((a) => {
              const content = (
                <>
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-full ring-1',
                      a.hasPublishedReport
                        ? 'bg-success-soft text-success ring-success-soft'
                        : 'bg-surface-muted text-link ring-border',
                    )}
                  >
                    {a.hasPublishedReport ? (
                      <FileCheck2 className="size-5" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <FileClock className="size-5" strokeWidth={1.5} aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{a.examType.name}</span>
                    <span className="block text-[13px] text-muted">
                      {formatClinicDateTime(a.scheduledAt)}
                    </span>
                    <span className="mt-3 block">
                      <Situation appointment={a} />
                    </span>
                  </span>
                </>
              );
              const box = 'flex items-center gap-4 rounded-4xl bg-surface p-5';
              return (
                <li key={a.id}>
                  {a.hasPublishedReport ? (
                    <Link
                      to={`/paciente/exames/${a.id}/laudo`}
                      className={cn(box, 'group transition hover:bg-primary-soft')}
                    >
                      {content}
                      <span className="grid size-9 place-items-center rounded-full bg-surface-muted text-muted transition group-hover:text-foreground">
                        <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                      </span>
                    </Link>
                  ) : (
                    <div className={box}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="px-4 text-xs text-muted">Datas e horários no horário de Brasília.</p>
        </section>
      )}
    </div>
  );
}
