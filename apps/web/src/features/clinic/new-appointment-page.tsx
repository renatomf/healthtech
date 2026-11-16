import { clinicDate, formatClinicDateTime } from '@healthtech/shared';
import { ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button.tsx';
import { Card } from '../../components/ui/card.tsx';
import { Field, Input, Select } from '../../components/ui/field.tsx';
import { Empty, ErrorMessage, Loading } from '../../components/ui/states.tsx';
import { cn } from '../../lib/cn.ts';
import { errorMessage } from '../../lib/messages.ts';
import { useCreateAppointment, useExamTypes, usePatients, useSlots } from './queries.ts';

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
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/clinica"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Agenda
      </Link>
      <h1 className="text-4xl font-light tracking-tight">Novo agendamento</h1>

      <Card className="space-y-4">
        <h2 className="font-medium">1. Paciente</h2>
        <Field label="Buscar por nome ou e-mail">
          {(p) => (
            <div className="relative">
              <Search className="absolute top-3.5 left-4 size-4 text-muted" aria-hidden />
              <Input
                {...p}
                className="pl-10"
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
          {patients.data?.map((p) => (
            <label
              key={p.id}
              className={cn(
                'flex cursor-pointer flex-col rounded-2xl border p-4 transition',
                p.id === patientId
                  ? 'border-primary bg-primary-soft'
                  : 'border-border hover:bg-surface-muted',
              )}
            >
              <input
                type="radio"
                name="patient"
                className="sr-only"
                checked={p.id === patientId}
                onChange={() => setPatientId(p.id)}
              />
              <span className="font-medium">{p.name}</span>
              <span className="text-sm text-muted">{p.email}</span>
            </label>
          ))}
        </fieldset>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-medium">2. Exame e horário</h2>
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
            <legend className="mb-3 text-sm font-medium">Horários (30 min)</legend>
            {slots.data.every((s) => !s.available) && (
              <Empty>Nenhum horário livre neste dia.</Empty>
            )}
            <div
              hidden={slots.data.every((s) => !s.available)}
              className="grid grid-cols-4 gap-2 sm:grid-cols-6"
            >
              {slots.data.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  disabled={!s.available}
                  aria-pressed={slot === s.startsAt}
                  onClick={() => setSlot(s.startsAt)}
                  className={cn(
                    'h-10 rounded-full text-sm tabular-nums transition',
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
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {ready && patient
            ? `${patient.name} · ${formatClinicDateTime(slot, "dd/MM 'às' HH:mm")}`
            : 'Escolha paciente, exame e horário.'}
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
