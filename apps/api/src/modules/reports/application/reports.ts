import type { Db } from '../../../db/client.ts';
import type { Clock } from '../../../shared/clock.ts';
import { AppError, notFound } from '../../../shared/errors.ts';
import { checkCanPublish, checkCanSaveDraft, type ReportProblem } from '../domain/report.ts';
import {
  findReport,
  insertDraft,
  lockAppointment,
  publishDraft,
  updateDraft,
} from '../infra/report-repository.ts';

export interface ReportsDeps {
  db: Db;
  clock: Clock;
}

const MESSAGES: Record<ReportProblem, string> = {
  APPOINTMENT_CANCELED: 'Agendamento cancelado não pode receber laudo',
  REPORT_ALREADY_PUBLISHED: 'Laudo já publicado não pode ser alterado',
  REPORT_DRAFT_REQUIRED: 'Salve o rascunho antes de publicar',
};

function fail(problem: ReportProblem | null) {
  if (problem) throw new AppError(409, problem, MESSAGES[problem]);
}

export async function saveDraft(
  { db, clock }: ReportsDeps,
  appointmentId: string,
  content: { title: string; body: string; professionalName: string },
  actorId: string,
) {
  return db.transaction(async (tx) => {
    const current = await lockAppointment(tx, appointmentId);
    if (!current) throw notFound();
    fail(checkCanSaveDraft(current.status, current.reportStatus));
    if (current.reportStatus === null) {
      await insertDraft(tx, appointmentId, content, actorId);
    } else {
      await updateDraft(tx, appointmentId, content, clock.now());
    }
    return findReport(tx, appointmentId);
  });
}

export async function publishReport(
  { db, clock }: ReportsDeps,
  appointmentId: string,
  actorId: string,
) {
  return db.transaction(async (tx) => {
    // Mesmo lock do cancelamento: publicar e cancelar o mesmo agendamento ficam em série.
    const current = await lockAppointment(tx, appointmentId);
    if (!current) throw notFound();
    fail(checkCanPublish(current.status, current.reportStatus));
    await publishDraft(tx, appointmentId, actorId, clock.now());
    return findReport(tx, appointmentId);
  });
}
