import { clinicDayRange, listClinicSlots } from '@healthtech/shared';
import type { Db } from '../../../db/client.ts';
import type { Clock } from '../../../shared/clock.ts';
import { AppError, notFound } from '../../../shared/errors.ts';
import { type BusinessHours, checkCancel, checkSlot } from '../domain/appointment.ts';
import {
  examTypeExists,
  findAppointment,
  insertAppointment,
  lockAppointment,
  markCanceled,
  patientExists,
  takenSlots,
} from '../infra/appointment-repository.ts';

export interface SchedulingDeps {
  db: Db;
  clock: Clock;
  hours: BusinessHours;
}

const MESSAGES = {
  SLOT_NOT_ALIGNED: 'Horário fora da grade de 30 minutos',
  SLOT_IN_PAST: 'Não é possível agendar no passado',
  SLOT_OUTSIDE_BUSINESS_HOURS: 'Horário fora do funcionamento da clínica',
  APPOINTMENT_ALREADY_CANCELED: 'Agendamento já cancelado',
  APPOINTMENT_HAS_PUBLISHED_REPORT: 'Agendamento com laudo publicado não pode ser cancelado',
};

export async function createAppointment(
  { db, clock, hours }: SchedulingDeps,
  input: { patientId: string; examTypeId: string; scheduledAt: Date },
  actorId: string,
) {
  const problem = checkSlot(input.scheduledAt, clock.now(), hours);
  if (problem) throw new AppError(422, problem, MESSAGES[problem]);
  if (!(await patientExists(db, input.patientId))) {
    throw new AppError(422, 'PATIENT_NOT_FOUND', 'Paciente não encontrado');
  }
  if (!(await examTypeExists(db, input.examTypeId))) {
    throw new AppError(422, 'EXAM_TYPE_NOT_FOUND', 'Tipo de exame não encontrado');
  }
  // Sem "verifica e insere": quem decide a disputa pelo horário é o índice uq_active_slot.
  const id = await insertAppointment(db, { ...input, createdBy: actorId });
  return findAppointment(db, id);
}

export async function cancelAppointment(
  { db, clock }: SchedulingDeps,
  id: string,
  actorId: string,
) {
  await db.transaction(async (tx) => {
    const current = await lockAppointment(tx, id);
    if (!current) throw notFound();
    const problem = checkCancel(current.status, current.reportStatus);
    if (problem) throw new AppError(409, problem, MESSAGES[problem]);
    await markCanceled(tx, id, actorId, clock.now());
  });
  return findAppointment(db, id);
}

export async function listSlots({ db, clock, hours }: SchedulingDeps, date: string) {
  const { start, end } = clinicDayRange(date, hours.timeZone);
  const taken = new Set((await takenSlots(db, start, end)).map((d) => d.getTime()));
  const now = clock.now();
  return listClinicSlots(date, hours.open, hours.close, hours.timeZone).map((slot) => ({
    startsAt: slot.toISOString(),
    available: slot > now && !taken.has(slot.getTime()),
  }));
}
