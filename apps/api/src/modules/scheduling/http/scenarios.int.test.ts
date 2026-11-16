import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, loginAs } from '../../../../test/app.ts';
import { useTestDb } from '../../../../test/db.ts';
import { makeExamType, makeUser } from '../../../../test/factories.ts';
import { appointments } from '../../../db/schema.ts';
import { fixedClock } from '../../../shared/clock.ts';

// "Agora" nos testes: 10/01/2030 10:10 em Brasília (13:10 UTC).
const NOW = '2030-01-10T13:10:00Z';

describe('Agendamento — cenários do enunciado', () => {
  const { db } = useTestDb();
  let app: FastifyInstance;
  let cookie: string;
  let patientId: string;
  let examTypeId: string;

  beforeEach(async () => {
    app = buildTestApp(db, fixedClock(NOW));
    const clinic = await makeUser(db, { role: 'CLINIC' });
    patientId = (await makeUser(db)).id;
    examTypeId = (await makeExamType(db)).id;
    cookie = await loginAs(app, clinic.email);
  });
  afterEach(() => app.close());

  const book = (scheduledAt: string) =>
    app.inject({
      method: 'POST',
      url: '/clinic/appointments',
      headers: { cookie },
      payload: { patientId, examTypeId, scheduledAt },
    });

  describe('Cenário 1 — duas tentativas simultâneas no mesmo horário', () => {
    it('aceita só uma de 10 reservas simultâneas do mesmo horário', async () => {
      const slot = '2030-01-11T14:00:00.000Z';

      const results = await Promise.all(Array.from({ length: 10 }, () => book(slot)));

      const statuses = results.map((r) => r.statusCode).sort();
      expect(statuses).toEqual([201, 409, 409, 409, 409, 409, 409, 409, 409, 409]);
      for (const res of results.filter((r) => r.statusCode === 409)) {
        expect(res.json()).toMatchObject({ code: 'SLOT_UNAVAILABLE' });
      }
      const rows = await db
        .select()
        .from(appointments)
        .where(eq(appointments.scheduledAt, new Date(slot)));
      expect(rows).toHaveLength(1);
      expect(rows[0]?.status).toBe('SCHEDULED');
    });
  });

  describe('Cenário 5 — agendar no passado é rejeitado', () => {
    it.each([
      ['slot de hoje que já começou (10:00, agora 10:10)', '2030-01-10T13:00:00.000Z'],
      ['ontem', '2030-01-09T13:00:00.000Z'],
    ])('rejeita %s', async (_label, slot) => {
      const res = await book(slot);

      expect(res.statusCode).toBe(422);
      expect(res.json()).toMatchObject({ code: 'SLOT_IN_PAST' });
      expect(await db.$count(appointments)).toBe(0);
    });

    it('aceita o próximo slot livre (10:30)', async () => {
      const res = await book('2030-01-10T13:30:00.000Z');

      expect(res.statusCode).toBe(201);
    });
  });
});
