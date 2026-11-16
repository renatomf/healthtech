import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, loginAs } from '../../../../test/app.ts';
import { useTestDb } from '../../../../test/db.ts';
import { makeAppointment, makeReport, makeUser } from '../../../../test/factories.ts';
import { appointments, reports } from '../../../db/schema.ts';

const content = { title: 'Laudo', body: 'Texto do laudo.', professionalName: 'Dra. Ana' };

describe('Laudos da clínica', () => {
  const { db } = useTestDb();
  let app: FastifyInstance;
  let clinicId: string;
  let cookie: string;

  beforeEach(async () => {
    app = buildTestApp(db);
    const clinic = await makeUser(db, { role: 'CLINIC' });
    clinicId = clinic.id;
    cookie = await loginAs(app, clinic.email);
  });
  afterEach(() => app.close());

  const save = (id: string, payload: object = content) =>
    app.inject({
      method: 'PUT',
      url: `/clinic/appointments/${id}/report`,
      headers: { cookie },
      payload,
    });
  const publish = (id: string) =>
    app.inject({
      method: 'POST',
      url: `/clinic/appointments/${id}/report/publish`,
      headers: { cookie },
    });
  const cancel = (id: string) =>
    app.inject({ method: 'POST', url: `/clinic/appointments/${id}/cancel`, headers: { cookie } });

  it('rascunho pode ser editado várias vezes', async () => {
    const appt = await makeAppointment(db, { createdBy: clinicId });

    await save(appt.id);
    const res = await save(appt.id, { ...content, body: 'Texto revisado.' });

    expect(res.json()).toMatchObject({
      status: 'DRAFT',
      body: 'Texto revisado.',
      publishedAt: null,
    });
    expect(await db.$count(reports)).toBe(1);
  });

  it('laudo publicado não pode ser editado nem publicado de novo', async () => {
    const appt = await makeAppointment(db, { createdBy: clinicId });
    await save(appt.id);
    const first = (await publish(appt.id)).json();

    const edit = await save(appt.id, { ...content, body: 'alterado' });
    const again = await publish(appt.id);

    expect(edit.json()).toMatchObject({ code: 'REPORT_ALREADY_PUBLISHED' });
    expect(again.json()).toMatchObject({ code: 'REPORT_ALREADY_PUBLISHED' });
    const [row] = await db.select().from(reports).where(eq(reports.appointmentId, appt.id));
    expect(row?.body).toBe(content.body);
    expect(row?.publishedAt?.toISOString()).toBe(first.publishedAt);
  });

  it('agendamento cancelado não recebe laudo', async () => {
    const appt = await makeAppointment(db, {
      createdBy: clinicId,
      status: 'CANCELED',
      canceledBy: clinicId,
      canceledAt: new Date(),
    });

    const res = await save(appt.id);

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: 'APPOINTMENT_CANCELED' });
    expect(await db.$count(reports)).toBe(0);
  });

  it('não publica sem rascunho salvo', async () => {
    const appt = await makeAppointment(db, { createdBy: clinicId });

    const res = await publish(appt.id);

    expect(res.json()).toMatchObject({ code: 'REPORT_DRAFT_REQUIRED' });
  });

  it('status e data de publicação nunca vêm do cliente', async () => {
    const appt = await makeAppointment(db, { createdBy: clinicId });

    const res = await save(appt.id, { ...content, status: 'PUBLISHED' });

    expect(res.statusCode).toBe(400);
    expect(await db.$count(reports)).toBe(0);
  });

  it('corrida cancelar × publicar: em 20 rodadas, nunca termina cancelado com laudo publicado', async () => {
    for (let round = 0; round < 20; round++) {
      const appt = await makeAppointment(db, {
        createdBy: clinicId,
        scheduledAt: new Date(Date.UTC(2030, 0, 10, 11, 0) + round * 30 * 60_000),
      });
      await makeReport(db, { appointmentId: appt.id, createdBy: clinicId });

      const [c, p] = await Promise.all([cancel(appt.id), publish(appt.id)]);

      expect([c.statusCode, p.statusCode].sort()).toEqual([200, 409]);
      const [a] = await db.select().from(appointments).where(eq(appointments.id, appt.id));
      const [r] = await db.select().from(reports).where(eq(reports.appointmentId, appt.id));
      expect(a?.status === 'CANCELED' && r?.status === 'PUBLISHED').toBe(false);
    }
  });
});
