import { clinicDate, formatClinicDateTime, parseClinicSlot } from '@healthtech/shared';
import { ArrowRight, CalendarCheck, FileCheck2, FileClock, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Heading } from '../../components/brand.tsx';
import { buttonClasses } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Field, Select } from '../../components/ui/field.tsx';
import { Stat } from '../../components/ui/stat.tsx';
import { Empty, ErrorMessage, Loading } from '../../components/ui/states.tsx';
import { cn } from '../../lib/cn.ts';
import { errorMessage } from '../../lib/messages.ts';
import { MiniCalendar } from './mini-calendar.tsx';
import { useAppointments, usePatients } from './queries.ts';
import { AppointmentBadges } from './status.tsx';

export function AgendaPage() {
  const today = clinicDate(new Date());
  const [params, setParams] = useSearchParams();
  const date = params.get('data') ?? today;
  const patientId = params.get('paciente') ?? '';
  const appointments = useAppointments({ date, patientId: patientId || undefined });
  const patients = usePatients('');

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const list = appointments.data ?? [];
  const icon = 'size-4';
  const stats = [
    {
      label: 'Agendados',
      value: list.filter((a) => a.status === 'SCHEDULED').length,
      icon: <CalendarCheck className={icon} strokeWidth={1.5} aria-hidden />,
    },
    {
      label: 'Laudos em rascunho',
      value: list.filter((a) => a.reportStatus === 'DRAFT').length,
      icon: <FileClock className={icon} strokeWidth={1.5} aria-hidden />,
    },
    {
      label: 'Laudos publicados',
      value: list.filter((a) => a.reportStatus === 'PUBLISHED').length,
      icon: <FileCheck2 className={icon} strokeWidth={1.5} aria-hidden />,
    },
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_21rem]">
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <Heading tail={formatClinicDateTime(parseClinicSlot(date, '12:00'), "EEEE, d 'de' MMMM")}>
            Agenda
          </Heading>
          <Link to="/clinica/agendamentos/novo" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden />
            Novo agendamento
          </Link>
        </header>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <Card key={s.label} tone={i === 0 ? 'hero' : 'surface'} className="min-h-44">
              <Stat value={s.value} label={s.label} icon={s.icon} inverted={i === 0} />
            </Card>
          ))}
        </div>

        <Card padded={false}>
          <div className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
            <h2 className="text-2xl font-light tracking-tight">Agendamentos do dia</h2>
            <div className="w-full sm:w-64">
              <Field label="Paciente">
                {(p) => (
                  <Select
                    {...p}
                    value={patientId}
                    onChange={(e) => setFilter('paciente', e.target.value)}
                  >
                    <option value="">Todos os pacientes</option>
                    {patients.data?.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </div>

          {appointments.isPending && <Loading />}
          {appointments.isError && (
            <div className="px-8 pb-8">
              <ErrorMessage>{errorMessage(appointments.error)}</ErrorMessage>
            </div>
          )}
          {appointments.isSuccess && list.length === 0 && (
            <Empty>Nenhum agendamento neste dia.</Empty>
          )}

          <ul className="space-y-2 px-3 pb-3">
            {[...list].reverse().map((a) => (
              <li key={a.id}>
                <Link
                  to={`/clinica/agendamentos/${a.id}`}
                  className="group flex items-center gap-5 rounded-3xl bg-surface-muted px-5 py-4 transition hover:bg-primary-soft"
                >
                  <span className="w-16 text-2xl font-light tracking-tight tabular-nums">
                    {formatClinicDateTime(a.scheduledAt, 'HH:mm')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate',
                        a.status === 'CANCELED' && 'text-muted line-through',
                      )}
                    >
                      {a.patient.name}
                    </span>
                    <span className="block text-[13px] text-muted">{a.examType.name}</span>
                    <span className="mt-2 block sm:hidden">
                      <AppointmentBadges appointment={a} />
                    </span>
                  </span>
                  <span className="hidden sm:block">
                    <AppointmentBadges appointment={a} />
                  </span>
                  <span className="grid size-9 place-items-center rounded-full bg-surface text-muted transition group-hover:text-foreground">
                    <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <aside className="space-y-3">
        <Card>
          <MiniCalendar
            key={date.slice(0, 7)}
            value={date}
            today={today}
            onChange={(d) => setFilter('data', d)}
          />
        </Card>
        <p className="px-4 text-xs leading-relaxed text-muted">
          Horários no horário de Brasília (America/Sao_Paulo), independentemente do fuso do seu
          computador.
        </p>
      </aside>
    </div>
  );
}
