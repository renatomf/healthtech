import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, loginAs } from '../../../../test/app.ts';
import { useTestDb } from '../../../../test/db.ts';
import { makeAppointment, makeExamType, makeReport, makeUser } from '../../../../test/factories.ts';
import { appointments } from '../../../db/schema.ts';
import { fixedClock } from '../../../shared/clock.ts';

// "Agora": 10/01/2030 10:10 em Brasília.
const NOW = '2030-01-10T13:10:00Z';

describe('Agendamentos da clínica', () => {
  const { db } = useTestDb();
  let app: FastifyInstance;
  let cookie: string;
  let clinicId: string;

  beforeEach(async () => {
    app = buildTestApp(db, fixedClock(NOW));
    const clinic = await makeUser(db, { role: 'CLINIC' });
    clinicId = clinic.id;
    cookie = await loginAs(app, clinic.email);
  });
  afterEach(() => app.close());

  const get = (url: string) => app.inject({ method: 'GET', url, headers: { cookie } });
  const post = (url: string, payload?: object) =>
    app.inject({ method: 'POST', url, headers: { cookie }, payload });

  it('filtra por dia no fuso da clínica: 22:30 de Brasília fica no dia certo', async () => {
    // 11/01 01:30 UTC = 10/01 22:30 em Brasília
    const late = await makeAppointment(db, {
      createdBy: clinicId,
      scheduledAt: new Date('2030-01-11T01:30:00Z'),
    });

    const day10 = (await get('/clinic/appointments?date=2030-01-10')).json();
    const day11 = (await get('/clinic/appointments?date=2030-01-11')).json();

    expect(day10.map((a: { id: string }) => a.id)).toEqual([late.id]);
    expect(day11).toEqual([]);
  });

  it('filtra por paciente', async () => {
    const mine = await makeAppointment(db, { createdBy: clinicId });
    await makeAppointment(db, {
      createdBy: clinicId,
      scheduledAt: new Date('2030-01-10T14:00:00Z'),
    });

    const res = await get(`/clinic/appointments?patientId=${mine.patientId}`);

    expect(res.json()).toHaveLength(1);
    expect(res.json()[0]).toMatchObject({ id: mine.id, patient: { id: mine.patientId } });
  });

  it('cancelar libera o horário para nova reserva', async () => {
    const appt = await makeAppointment(db, {
      createdBy: clinicId,
      scheduledAt: new Date('2030-01-11T14:00:00Z'),
    });

    const cancel = await post(`/clinic/appointments/${appt.id}/cancel`);
    const rebook = await post('/clinic/appointments', {
      patientId: appt.patientId,
      examTypeId: appt.examTypeId,
      scheduledAt: '2030-01-11T14:00:00.000Z',
    });

    expect(cancel.json()).toMatchObject({ status: 'CANCELED' });
    expect(rebook.statusCode).toBe(201);
    const [row] = await db.select().from(appointments).where(eq(appointments.id, appt.id));
    expect(row).toMatchObject({ status: 'CANCELED', canceledBy: clinicId });
  });

  it('não cancela agendamento com laudo publicado', async () => {
    const appt = await makeAppointment(db, { createdBy: clinicId });
    await makeReport(db, {
      appointmentId: appt.id,
      createdBy: clinicId,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });

    const res = await post(`/clinic/appointments/${appt.id}/cancel`);

    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: 'APPOINTMENT_HAS_PUBLISHED_REPORT' });
    expect(await db.$count(appointments, eq(appointments.status, 'SCHEDULED'))).toBe(1);
  });

  it('rejeita horário fora do funcionamento e paciente inexistente', async () => {
    const examType = await makeExamType(db);
    const patient = await makeUser(db);
    const book = (patientId: string, scheduledAt: string) =>
      post('/clinic/appointments', { patientId, examTypeId: examType.id, scheduledAt });

    const night = await book(patient.id, '2030-01-11T22:00:00.000Z'); // 19:00
    const clinicAsPatient = await book(clinicId, '2030-01-11T14:00:00.000Z');

    expect(night.json()).toMatchObject({ code: 'SLOT_OUTSIDE_BUSINESS_HOURS' });
    expect(clinicAsPatient.json()).toMatchObject({ code: 'PATIENT_NOT_FOUND' });
    expect(await db.$count(appointments)).toBe(0);
  });

  it('lista slots do dia marcando ocupados e passados como indisponíveis', async () => {
    await makeAppointment(db, {
      createdBy: clinicId,
      scheduledAt: new Date('2030-01-10T14:00:00Z'),
    });

    const slots: { startsAt: string; available: boolean }[] = (
      await get('/clinic/slots?date=2030-01-10')
    ).json();

    const available = (iso: string) => slots.find((s) => s.startsAt === iso)?.available;
    expect(slots).toHaveLength(20);
    expect(available('2030-01-10T13:00:00.000Z')).toBe(false); // 10:00, já começou
    expect(available('2030-01-10T13:30:00.000Z')).toBe(true); // 10:30
    expect(available('2030-01-10T14:00:00.000Z')).toBe(false); // 11:00, ocupado
  });

  it('paciente não acessa rotas da clínica (403) e sem login é 401', async () => {
    const patient = await makeUser(db);
    const patientCookie = await loginAs(app, patient.email);

    const asPatient = await app.inject({
      method: 'GET',
      url: '/clinic/appointments',
      headers: { cookie: patientCookie },
    });
    const anonymous = await app.inject({ method: 'GET', url: '/clinic/appointments' });

    expect(asPatient.statusCode).toBe(403);
    expect(anonymous.statusCode).toBe(401);
  });

  it('busca pacientes por nome ou e-mail, sem tratar % como curinga', async () => {
    await makeUser(db, { name: 'Maria Oliveira', email: 'maria@demo.local' });
    await makeUser(db, { name: 'João da Silva', email: 'joao@demo.local' });

    const byName = (await get('/clinic/patients?search=mari')).json();
    const wildcard = (await get('/clinic/patients?search=%25')).json();

    expect(byName.map((p: { name: string }) => p.name)).toEqual(['Maria Oliveira']);
    expect(wildcard).toEqual([]);
  });
});
