import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';
import type { Db, Tx } from '../../../db/client.ts';
import { pgErrorOf } from '../../../db/pg-error.ts';
import { appointments, examTypes, reports, users } from '../../../db/schema.ts';
import { AppError } from '../../../shared/errors.ts';

function selectAppointments(db: Db) {
  return db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      patient: { id: users.id, name: users.name },
      examType: { id: examTypes.id, code: examTypes.code, name: examTypes.name },
      reportStatus: reports.status,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientId))
    .innerJoin(examTypes, eq(examTypes.id, appointments.examTypeId))
    .leftJoin(reports, eq(reports.appointmentId, appointments.id));
}

export type AppointmentView = NonNullable<Awaited<ReturnType<typeof findAppointment>>>;

export async function findAppointment(db: Db, id: string) {
  const [row] = await selectAppointments(db).where(eq(appointments.id, id));
  return row;
}

export interface AppointmentFilters {
  range?: { start: Date; end: Date };
  patientId?: string;
}

export function listAppointments(db: Db, { range, patientId }: AppointmentFilters) {
  return selectAppointments(db)
    .where(
      and(
        range && gte(appointments.scheduledAt, range.start),
        range && lt(appointments.scheduledAt, range.end),
        patientId ? eq(appointments.patientId, patientId) : undefined,
      ),
    )
    .orderBy(desc(appointments.scheduledAt))
    .limit(100);
}

export async function insertAppointment(db: Db, values: typeof appointments.$inferInsert) {
  try {
    const [row] = await db.insert(appointments).values(values).returning({ id: appointments.id });
    if (!row) throw new Error('insert sem retorno');
    return row.id;
  } catch (err) {
    if (pgErrorOf(err).constraint === 'uq_active_slot') {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'Horário indisponível');
    }
    throw err;
  }
}

/** Trava a linha do agendamento até o fim da transação (ADR-004). */
export async function lockAppointment(tx: Tx, id: string) {
  const [row] = await tx
    .select({ status: appointments.status, reportStatus: reports.status })
    .from(appointments)
    .leftJoin(reports, eq(reports.appointmentId, appointments.id))
    .where(eq(appointments.id, id))
    .for('update', { of: appointments });
  return row;
}

export async function markCanceled(tx: Tx, id: string, actorId: string, now: Date) {
  await tx
    .update(appointments)
    .set({ status: 'CANCELED', canceledBy: actorId, canceledAt: now })
    .where(eq(appointments.id, id));
}

export async function takenSlots(db: Db, start: Date, end: Date) {
  const rows = await db
    .select({ scheduledAt: appointments.scheduledAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.status, 'SCHEDULED'),
        gte(appointments.scheduledAt, start),
        lt(appointments.scheduledAt, end),
      ),
    );
  return rows.map((r) => r.scheduledAt);
}

export function listExamTypes(db: Db) {
  return db.select().from(examTypes).orderBy(asc(examTypes.name));
}

export async function examTypeExists(db: Db, id: string) {
  return (await db.$count(examTypes, eq(examTypes.id, id))) > 0;
}

export async function patientExists(db: Db, id: string) {
  return (await db.$count(users, and(eq(users.id, id), eq(users.role, 'PATIENT')))) > 0;
}
