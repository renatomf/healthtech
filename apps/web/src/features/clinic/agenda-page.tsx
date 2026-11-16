import { clinicDate, formatClinicDateTime, parseClinicSlot } from '@healthtech/shared';
import { ChevronRight, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { buttonClasses } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Field, Select } from '../../components/ui/field.tsx';
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
  const active = list.filter((a) => a.status === 'SCHEDULED');
  const stats = [
    { label: 'Agendados', value: active.length, highlight: true },
    { label: 'Laudos em rascunho', value: list.filter((a) => a.reportStatus === 'DRAFT').length },
    {
      label: 'Laudos publicados',
      value: list.filter((a) => a.reportStatus === 'PUBLISHED').length,
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-light tracking-tight">Agenda</h1>
            <p className="mt-1 text-muted first-letter:uppercase">
              {formatClinicDateTime(parseClinicSlot(date, '12:00'), "EEEE, d 'de' MMMM 'de' yyyy")}
            </p>
          </div>
          <Link to="/clinica/agendamentos/novo" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden />
            Novo agendamento
          </Link>
        </header>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                'rounded-3xl p-4 sm:p-5',
                s.highlight
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-surface',
              )}
            >
              <p className={cn('text-sm', s.highlight ? 'opacity-90' : 'text-muted')}>{s.label}</p>
              <p className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">{s.value}</p>
            </div>
          ))}
        </div>

        <Card padded={false}>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-6">
            <h2 className="text-lg font-medium">Agendamentos do dia</h2>
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
            <div className="p-6">
              <ErrorMessage>{errorMessage(appointments.error)}</ErrorMessage>
            </div>
          )}
          {appointments.isSuccess && list.length === 0 && (
            <Empty>Nenhum agendamento neste dia.</Empty>
          )}

          <ul className="divide-y divide-border">
            {[...list].reverse().map((a) => (
              <li key={a.id}>
                <Link
                  to={`/clinica/agendamentos/${a.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-surface-muted"
                >
                  <span className="w-16 text-2xl font-light tracking-tight tabular-nums">
                    {formatClinicDateTime(a.scheduledAt, 'HH:mm')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate font-medium',
                        a.status === 'CANCELED' && 'text-muted line-through',
                      )}
                    >
                      {a.patient.name}
                    </span>
                    <span className="block text-sm text-muted">{a.examType.name}</span>
                    <span className="mt-2 block sm:hidden">
                      <AppointmentBadges appointment={a} />
                    </span>
                  </span>
                  <span className="hidden sm:block">
                    <AppointmentBadges appointment={a} />
                  </span>
                  <ChevronRight className="size-4 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <MiniCalendar
            key={date.slice(0, 7)}
            value={date}
            today={today}
            onChange={(d) => setFilter('data', d)}
          />
        </Card>
        <p className="px-2 text-xs text-muted">
          Horários no horário de Brasília (America/Sao_Paulo), independentemente do fuso do seu
          computador.
        </p>
      </aside>
    </div>
  );
}
