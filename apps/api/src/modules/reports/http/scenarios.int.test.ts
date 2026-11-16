import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, loginAs } from '../../../../test/app.ts';
import { useTestDb } from '../../../../test/db.ts';
import { makeAppointment, makeReport, makeUser } from '../../../../test/factories.ts';

describe('Laudos e acesso do paciente — cenários do enunciado', () => {
  const { db } = useTestDb();
  let app: FastifyInstance;
  let clinicId: string;
  let clinicCookie: string;
  let patientA: { id: string; cookie: string };
  let patientB: { id: string; cookie: string };

  beforeEach(async () => {
    app = buildTestApp(db);
    const clinic = await makeUser(db, { role: 'CLINIC' });
    const a = await makeUser(db, { name: 'Paciente A' });
    const b = await makeUser(db, { name: 'Paciente B' });
    clinicId = clinic.id;
    clinicCookie = await loginAs(app, clinic.email);
    patientA = { id: a.id, cookie: await loginAs(app, a.email) };
    patientB = { id: b.id, cookie: await loginAs(app, b.email) };
  });
  afterEach(() => app.close());

  const asPatient = (cookie: string, url: string) =>
    app.inject({ method: 'GET', url, headers: { cookie } });

  describe('Cenário 2 — paciente tenta ler laudo de outro paciente', () => {
    it('responde 404 sem revelar o conteúdo', async () => {
      const appt = await makeAppointment(db, { patientId: patientA.id, createdBy: clinicId });
      await makeReport(db, {
        appointmentId: appt.id,
        createdBy: clinicId,
        title: 'Laudo do paciente A',
        body: 'Conteúdo sigiloso do paciente A',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      });
      const url = `/patient/appointments/${appt.id}/report`;

      const other = await asPatient(patientB.cookie, url);
      const owner = await asPatient(patientA.cookie, url);

      expect(other.statusCode).toBe(404);
      expect(other.json()).toMatchObject({ code: 'NOT_FOUND' });
      expect(other.body).not.toContain('paciente A');
      expect(owner.statusCode).toBe(200);
    });
  });

  describe('Cenário 3 — paciente tenta acessar rascunho', () => {
    it('não disponibiliza o rascunho em nenhuma resposta', async () => {
      const appt = await makeAppointment(db, { patientId: patientA.id, createdBy: clinicId });
      await makeReport(db, {
        appointmentId: appt.id,
        createdBy: clinicId,
        title: 'Título do rascunho',
        body: 'Texto do rascunho em revisão',
      });

      const report = await asPatient(patientA.cookie, `/patient/appointments/${appt.id}/report`);
      const list = await asPatient(patientA.cookie, '/patient/appointments');

      expect(report.statusCode).toBe(404);
      expect(list.json()).toEqual([
        expect.objectContaining({ id: appt.id, hasPublishedReport: false }),
      ]);
      for (const res of [report, list]) {
        expect(res.body).not.toContain('rascunho');
      }
    });
  });

  describe('Cenário 4 — laudo publicado fica disponível ao paciente correto', () => {
    it('clínica salva e publica; só o dono do exame lê', async () => {
      const appt = await makeAppointment(db, { patientId: patientA.id, createdBy: clinicId });
      const url = `/clinic/appointments/${appt.id}/report`;

      const saved = await app.inject({
        method: 'PUT',
        url,
        headers: { cookie: clinicCookie },
        payload: {
          title: 'Raio-X de tórax',
          body: 'Sem alterações.',
          professionalName: 'Dra. Ana',
        },
      });
      const published = await app.inject({
        method: 'POST',
        url: `${url}/publish`,
        headers: { cookie: clinicCookie },
      });

      expect(saved.statusCode).toBe(200);
      expect(published.statusCode).toBe(200);

      const ownerRead = await asPatient(patientA.cookie, `/patient/appointments/${appt.id}/report`);
      const otherRead = await asPatient(patientB.cookie, `/patient/appointments/${appt.id}/report`);
      const ownerList = await asPatient(patientA.cookie, '/patient/appointments');

      expect(ownerRead.statusCode).toBe(200);
      expect(ownerRead.json()).toMatchObject({
        title: 'Raio-X de tórax',
        body: 'Sem alterações.',
        professionalName: 'Dra. Ana',
        publishedAt: expect.any(String),
      });
      expect(otherRead.statusCode).toBe(404);
      expect(ownerList.json()[0]).toMatchObject({ id: appt.id, hasPublishedReport: true });
    });
  });
});
