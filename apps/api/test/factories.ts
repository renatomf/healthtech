import { randomUUID } from 'node:crypto';
import type { Db } from '../src/db/client.ts';
import { appointments, examTypes, reports, users } from '../src/db/schema.ts';

type NewUser = typeof users.$inferInsert;
type NewAppointment = typeof appointments.$inferInsert;
type NewReport = typeof reports.$inferInsert;

/** Hash bcrypt fictício: as factories não fazem login. */
const FAKE_HASH = '$2a$12$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuvwxyz01234';

export async function makeUser(db: Db, overrides: Partial<NewUser> = {}) {
  const [row] = await db
    .insert(users)
    .values({
      name: 'Paciente Teste',
      email: `user-${randomUUID()}@demo.local`,
      passwordHash: FAKE_HASH,
      role: 'PATIENT',
      ...overrides,
    })
    .returning();
  if (!row) throw new Error('makeUser: nenhuma linha');
  return row;
}

export async function makeExamType(db: Db, overrides: Partial<typeof examTypes.$inferInsert> = {}) {
  const [row] = await db
    .insert(examTypes)
    .values({ code: `EXAME_${randomUUID().slice(0, 8)}`, name: 'Exame Teste', ...overrides })
    .returning();
  if (!row) throw new Error('makeExamType: nenhuma linha');
  return row;
}

/** Cria clínica, paciente e tipo de exame quando não informados. */
export async function makeAppointment(db: Db, overrides: Partial<NewAppointment> = {}) {
  const createdBy = overrides.createdBy ?? (await makeUser(db, { role: 'CLINIC' })).id;
  const patientId = overrides.patientId ?? (await makeUser(db)).id;
  const examTypeId = overrides.examTypeId ?? (await makeExamType(db)).id;
  const [row] = await db
    .insert(appointments)
    .values({
      scheduledAt: new Date('2030-01-10T13:00:00Z'),
      ...overrides,
      patientId,
      examTypeId,
      createdBy,
    })
    .returning();
  if (!row) throw new Error('makeAppointment: nenhuma linha');
  return row;
}

export async function makeReport(
  db: Db,
  overrides: Partial<NewReport> & Pick<NewReport, 'appointmentId' | 'createdBy'>,
) {
  const [row] = await db
    .insert(reports)
    .values({
      title: 'Laudo teste',
      body: 'Texto do laudo de teste.',
      professionalName: 'Dra. Teste',
      ...overrides,
    })
    .returning();
  if (!row) throw new Error('makeReport: nenhuma linha');
  return row;
}
