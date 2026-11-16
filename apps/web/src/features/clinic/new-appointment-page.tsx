import { clinicDate, formatClinicDateTime } from '@healthtech/shared';
import { ArrowLeft, Check, Search } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Heading } from '../../components/brand.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Field, Input, Select } from '../../components/ui/field.tsx';
import { Empty, ErrorMessage, Loading } from '../../components/ui/states.tsx';
import { cn } from '../../lib/cn.ts';
import { errorMessage } from '../../lib/messages.ts';
import { useCreateAppointment, useExamTypes, usePatients, useSlots } from './queries.ts';

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <Card className="space-y-6">
      <div>
        <p className="text-sm text-muted tabular-nums">{n}</p>
        <h2 className="mt-1 text-2xl font-light tracking-tight">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const today = clinicDate(new Date());
  const [search, setSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState('');

  const patients = usePatients(search);
  const examTypes = useExamTypes();
  const slots = useSlots(date);
  const create = useCreateAppointment();

  const patient = patients.data?.find((p) => p.id === patientId);
  const ready = patientId && examTypeId && slot;
  const noSlots = slots.isSuccess && slots.data.every((s) => !s.available);

  const submit = () =>
    create.mutate(
      { patientId, examTypeId, scheduledAt: slot },
      {
        onSuccess: () => navigate(`/clinica?data=${date}`),
        // Em 409 a grade já foi recarregada (onSettled); só limpamos a escolha.
        onError: () => setSlot(''),
      },
    );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/clinica"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden /> Agenda
      </Link>
      <Heading tail="paciente, exame e horário.">Novo agendamento</Heading>

      <Step n="01" title="Paciente">
        <Field label="Buscar por nome ou e-mail">
          {(p) => (
            <div className="relative">
              <Search
                className="absolute top-4 left-4 size-4 text-muted"
                strokeWidth={1.5}
                aria-hidden
              />
              <Input
                {...p}
                className="pl-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </Field>
        {patients.isPending && <Loading />}
        {patients.isSuccess && patients.data.length === 0 && (
          <Empty>Nenhum paciente encontrado.</Empty>
        )}
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Paciente</legend>
          {patients.data?.map((p) => {
            const checked = p.id === patientId;
            return (
              <label
                key={p.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-3xl p-5 transition',
                  checked ? 'bg-primary-soft' : 'bg-surface-muted hover:bg-primary-soft',
                )}
              >
                <input
                  type="radio"
                  name="patient"
                  className="sr-only"
                  checked={checked}
                  onChange={() => setPatientId(p.id)}
                />
                <span>
                  <span className="block">{p.name}</span>
                  <span className="block text-[13px] text-muted">{p.email}</span>
                </span>
                {checked && (
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" aria-hidden />
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      </Step>

      <Step n="02" title="Exame e horário">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de exame">
            {(p) => (
              <Select {...p} value={examTypeId} onChange={(e) => setExamTypeId(e.target.value)}>
                <option value="">Selecione</option>
                {examTypes.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Dia" hint="Horário de Brasília">
            {(p) => (
              <Input
                {...p}
                type="date"
                min={today}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlot('');
                }}
              />
            )}
          </Field>
        </div>

        {slots.isPending && date && <Loading label="Carregando horários…" />}
        {slots.isError && <ErrorMessage>{errorMessage(slots.error)}</ErrorMessage>}
        {slots.isSuccess && (
          <fieldset>
            <legend className="mb-3 text-[13px] text-muted">Horários (30 min)</legend>
            {noSlots && <Empty>Nenhum horário livre neste dia.</Empty>}
            <div hidden={noSlots} className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.data.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  disabled={!s.available}
                  aria-pressed={slot === s.startsAt}
                  onClick={() => setSlot(s.startsAt)}
                  className={cn(
                    'h-11 rounded-full text-sm tabular-nums transition',
                    slot === s.startsAt
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface-muted hover:bg-primary-soft',
                    'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted disabled:line-through',
                  )}
                >
                  {formatClinicDateTime(s.startsAt, 'HH:mm')}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </Step>

      <Card tone="muted" className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">
          {ready && patient ? (
            <>
              {patient.name}
              <span className="text-muted">
                {' · '}
                {formatClinicDateTime(slot, "dd/MM 'às' HH:mm")}
              </span>
            </>
          ) : (
            <span className="text-muted">Escolha paciente, exame e horário.</span>
          )}
        </p>
        <Button onClick={submit} disabled={!ready || create.isPending}>
          {create.isPending ? 'Agendando…' : 'Confirmar agendamento'}
        </Button>
        {create.isError && (
          <div className="w-full">
            <ErrorMessage>{errorMessage(create.error)}</ErrorMessage>
          </div>
        )}
      </Card>
    </div>
  );
}
