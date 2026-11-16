import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db, Tx } from '../../../db/client.ts';
import { pgErrorOf } from '../../../db/pg-error.ts';
import { appointments, examTypes, reports } from '../../../db/schema.ts';
import { AppError } from '../../../shared/errors.ts';

const alreadyPublished = () =>
  new AppError(409, 'REPORT_ALREADY_PUBLISHED', 'Laudo já publicado não pode ser alterado');

/** Trava a linha do agendamento até o fim da transação (ADR-004). */
export async function lockAppointment(tx: Tx, appointmentId: string) {
  const [appointment] = await tx
    .select({ status: appointments.status })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .for('update');
  if (!appointment) return undefined;
  // Consulta separada, DEPOIS do lock: em READ COMMITTED ela enxerga o que a transação
  // que segurava o lock acabou de gravar. Num JOIN com FOR UPDATE, o laudo viria desatualizado.
  const [report] = await tx
    .select({ status: reports.status })
    .from(reports)
    .where(eq(reports.appointmentId, appointmentId));
  return { status: appointment.status, reportStatus: report?.status ?? null };
}

export async function findReport(db: Db | Tx, appointmentId: string) {
  const [row] = await db.select().from(reports).where(eq(reports.appointmentId, appointmentId));
  return row;
}

interface ReportContent {
  title: string;
  body: string;
  professionalName: string;
}

export async function insertDraft(
  tx: Tx,
  appointmentId: string,
  content: ReportContent,
  actorId: string,
) {
  try {
    await tx.insert(reports).values({ ...content, appointmentId, createdBy: actorId });
  } catch (err) {
    if (pgErrorOf(err).constraint === 'uq_report_appointment') {
      throw new AppError(409, 'REPORT_ALREADY_EXISTS', 'O agendamento já tem laudo');
    }
    throw err;
  }
}

export async function updateDraft(
  tx: Tx,
  appointmentId: string,
  content: ReportContent,
  now: Date,
) {
  try {
    await tx
      .update(reports)
      .set({ ...content, updatedAt: now })
      .where(and(eq(reports.appointmentId, appointmentId), eq(reports.status, 'DRAFT')));
  } catch (err) {
    // Trigger trg_report_immutable
    if (pgErrorOf(err).code === 'P0001') throw alreadyPublished();
    throw err;
  }
}

/** Publica só se ainda for rascunho; zero linhas significa que alguém publicou antes. */
export async function publishDraft(tx: Tx, appointmentId: string, actorId: string, now: Date) {
  const rows = await tx
    .update(reports)
    .set({ status: 'PUBLISHED', publishedAt: now, publishedBy: actorId, updatedAt: now })
    .where(and(eq(reports.appointmentId, appointmentId), eq(reports.status, 'DRAFT')))
    .returning();
  if (rows.length === 0) throw alreadyPublished();
}

// --- Paciente: o filtro pelo paciente do token está sempre na query (ADR-007).

export function listPatientAppointments(db: Db, patientId: string) {
  return db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      examType: { name: examTypes.name },
      hasPublishedReport: sql<boolean>`coalesce(${reports.status} = 'PUBLISHED', false)`,
    })
    .from(appointments)
    .innerJoin(examTypes, eq(examTypes.id, appointments.examTypeId))
    .leftJoin(reports, eq(reports.appointmentId, appointments.id))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.scheduledAt));
}

export async function findPublishedReportForPatient(
  db: Db,
  appointmentId: string,
  patientId: string,
) {
  const [row] = await db
    .select({
      title: reports.title,
      body: reports.body,
      professionalName: reports.professionalName,
      publishedAt: reports.publishedAt,
    })
    .from(reports)
    .innerJoin(appointments, eq(appointments.id, reports.appointmentId))
    .where(
      and(
        eq(reports.appointmentId, appointmentId),
        eq(appointments.patientId, patientId),
        eq(reports.status, 'PUBLISHED'),
      ),
    );
  return row;
}
