import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { pgError, useTestDb } from '../../test/db.ts';
import { makeAppointment, makeReport, makeUser } from '../../test/factories.ts';
import { appointments, reports } from './schema.ts';

describe('Constraints do banco', () => {
  const { db, sql } = useTestDb();
  const slot = new Date('2030-01-10T13:00:00Z');

  it('rejeita dois agendamentos ativos no mesmo horário', async () => {
    await makeAppointment(db, { scheduledAt: slot });

    const err = await pgError(makeAppointment(db, { scheduledAt: slot }));

    expect(err).toEqual({ code: '23505', constraint: 'uq_active_slot' });
  });

  it('permite reutilizar o horário de um agendamento cancelado', async () => {
    const clinic = await makeUser(db, { role: 'CLINIC' });
    await makeAppointment(db, {
      scheduledAt: slot,
      status: 'CANCELED',
      canceledBy: clinic.id,
      canceledAt: new Date(),
    });

    await makeAppointment(db, { scheduledAt: slot });

    expect(await db.$count(appointments, eq(appointments.scheduledAt, slot))).toBe(2);
  });

  it('rejeita horário fora da grade de 30 minutos', async () => {
    const err = await pgError(
      makeAppointment(db, { scheduledAt: new Date('2030-01-10T13:15:00Z') }),
    );

    expect(err).toEqual({ code: '23514', constraint: 'chk_slot_aligned' });
  });

  it('rejeita segundo laudo para o mesmo agendamento', async () => {
    const appt = await makeAppointment(db);
    await makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy });

    const err = await pgError(
      makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy }),
    );

    expect(err).toEqual({ code: '23505', constraint: 'uq_report_appointment' });
  });

  it('rejeita laudo publicado sem data de publicação', async () => {
    const appt = await makeAppointment(db);

    const err = await pgError(
      makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy, status: 'PUBLISHED' }),
    );

    expect(err).toEqual({ code: '23514', constraint: 'chk_published' });
  });

  it('rejeita alteração de laudo publicado, mesmo via SQL direto', async () => {
    const appt = await makeAppointment(db);
    const report = await makeReport(db, {
      appointmentId: appt.id,
      createdBy: appt.createdBy,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    const err = await pgError(sql`UPDATE reports SET body = 'alterado' WHERE id = ${report.id}`);

    expect(err.code).toBe('P0001');
    const [row] = await db.select().from(reports).where(eq(reports.id, report.id));
    expect(row?.body).toBe(report.body);
  });
});
