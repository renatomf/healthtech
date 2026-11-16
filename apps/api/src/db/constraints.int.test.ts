import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { pgError, useTestDb } from '../../test/db.ts';
import { makeAppointment, makeReport, makeUser } from '../../test/factories.ts';
import { appointments, reports } from './schema.ts';

/**
 * Invariantes garantidas pelo banco, independentemente da aplicação
 * (defesa em profundidade — ARQUITETURA.md §Constraints).
 */
describe('Constraints do banco', () => {
  const { db, sql } = useTestDb();
  const slot = new Date('2030-01-10T13:00:00Z');

  describe('uq_active_slot — um agendamento ativo por horário', () => {
    it('rejeita segundo agendamento ativo no mesmo horário', async () => {
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

      const rows = await db.select().from(appointments).where(eq(appointments.scheduledAt, slot));
      expect(rows.map((r) => r.status).sort()).toEqual(['CANCELED', 'SCHEDULED']);
    });
  });

  describe('chk_slot_aligned — slots fixos de 30 minutos', () => {
    it.each([
      ['minuto 15', '2030-01-10T13:15:00Z'],
      ['com segundos', '2030-01-10T13:00:30Z'],
      ['com milissegundos', '2030-01-10T13:30:00.500Z'],
    ])('rejeita horário desalinhado (%s)', async (_label, iso) => {
      const err = await pgError(makeAppointment(db, { scheduledAt: new Date(iso) }));

      expect(err).toEqual({ code: '23514', constraint: 'chk_slot_aligned' });
    });

    it('aceita :00 e :30 UTC independentemente do TimeZone da sessão', async () => {
      const base = await makeAppointment(db, { scheduledAt: new Date('2030-01-09T13:00:00Z') });
      // Asia/Kathmandu é +05:45: um CHECK avaliado no fuso da sessão veria 13:00Z como :45.
      const conn = await sql.reserve();
      try {
        await conn`SET TIME ZONE 'Asia/Kathmandu'`;
        for (const iso of ['2030-01-10T13:00:00Z', '2030-01-10T13:30:00Z']) {
          await conn`
            INSERT INTO appointments (patient_id, exam_type_id, scheduled_at, created_by)
            VALUES (${base.patientId}, ${base.examTypeId}, ${iso}, ${base.createdBy})`;
        }
      } finally {
        await conn`RESET TIME ZONE`;
        conn.release();
      }

      expect(await db.$count(appointments)).toBe(3);
    });
  });

  describe('chk_canceled — cancelamento registra quem e quando', () => {
    it('rejeita agendamento cancelado sem data e autor do cancelamento', async () => {
      const err = await pgError(makeAppointment(db, { status: 'CANCELED' }));

      expect(err).toEqual({ code: '23514', constraint: 'chk_canceled' });
    });
  });

  describe('uq_report_appointment — um laudo por agendamento', () => {
    it('rejeita segundo laudo para o mesmo agendamento', async () => {
      const appt = await makeAppointment(db);
      await makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy });

      const err = await pgError(
        makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy }),
      );

      expect(err).toEqual({ code: '23505', constraint: 'uq_report_appointment' });
    });
  });

  describe('chk_published — data de publicação se e somente se publicado', () => {
    it('rejeita laudo publicado sem data de publicação', async () => {
      const appt = await makeAppointment(db);

      const err = await pgError(
        makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy, status: 'PUBLISHED' }),
      );

      expect(err).toEqual({ code: '23514', constraint: 'chk_published' });
    });

    it('rejeita rascunho com data de publicação', async () => {
      const appt = await makeAppointment(db);

      const err = await pgError(
        makeReport(db, {
          appointmentId: appt.id,
          createdBy: appt.createdBy,
          publishedAt: new Date(),
          publishedBy: appt.createdBy,
        }),
      );

      expect(err).toEqual({ code: '23514', constraint: 'chk_published' });
    });
  });

  describe('chk_report_body_length — texto do laudo limitado', () => {
    it('rejeita laudo com mais de 20.000 caracteres', async () => {
      const appt = await makeAppointment(db);

      const err = await pgError(
        makeReport(db, {
          appointmentId: appt.id,
          createdBy: appt.createdBy,
          body: 'a'.repeat(20_001),
        }),
      );

      expect(err).toEqual({ code: '23514', constraint: 'chk_report_body_length' });
    });
  });

  describe('trg_report_immutable — laudo publicado é imutável', () => {
    async function publishedReport() {
      const appt = await makeAppointment(db);
      return makeReport(db, {
        appointmentId: appt.id,
        createdBy: appt.createdBy,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: appt.createdBy,
      });
    }

    it('rejeita UPDATE em laudo publicado, mesmo via SQL direto', async () => {
      const report = await publishedReport();

      const err = await pgError(sql`UPDATE reports SET body = 'alterado' WHERE id = ${report.id}`);

      expect(err.code).toBe('P0001');
      const [row] = await db.select().from(reports).where(eq(reports.id, report.id));
      expect(row?.body).toBe(report.body);
    });

    it('rejeita DELETE de laudo publicado', async () => {
      const report = await publishedReport();

      const err = await pgError(sql`DELETE FROM reports WHERE id = ${report.id}`);

      expect(err.code).toBe('P0001');
      expect(await db.$count(reports)).toBe(1);
    });

    it('permite editar e publicar um rascunho', async () => {
      const appt = await makeAppointment(db);
      const draft = await makeReport(db, { appointmentId: appt.id, createdBy: appt.createdBy });

      await db.update(reports).set({ body: 'revisado' }).where(eq(reports.id, draft.id));
      const [published] = await db
        .update(reports)
        .set({ status: 'PUBLISHED', publishedAt: new Date(), publishedBy: appt.createdBy })
        .where(eq(reports.id, draft.id))
        .returning();

      expect(published).toMatchObject({ status: 'PUBLISHED', body: 'revisado' });
    });
  });

  describe('chk_users_email_lowercase', () => {
    it('rejeita e-mail com maiúsculas (normalização é obrigatória)', async () => {
      const err = await pgError(makeUser(db, { email: 'Joao@Demo.local' }));

      expect(err).toEqual({ code: '23514', constraint: 'chk_users_email_lowercase' });
    });
  });
});
