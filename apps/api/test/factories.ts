import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Db } from '../src/db/client.ts';
import { appointments, examTypes, reports, users } from '../src/db/schema.ts';

export const TEST_PASSWORD = 'Senha@123';
// Custo 4 só nos testes, para não deixar a suíte lenta.
const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 4);

function first<T>(rows: T[]): T {
  const [row] = rows;
  if (!row) throw new Error('insert não retornou linha');
  return row;
}

export async function makeUser(db: Db, overrides: Partial<typeof users.$inferInsert> = {}) {
  const values = {
    name: 'Paciente Teste',
    email: `user-${randomUUID()}@demo.local`,
    passwordHash: TEST_PASSWORD_HASH,
    role: 'PATIENT' as const,
    ...overrides,
  };
  return first(await db.insert(users).values(values).returning());
}

export async function makeExamType(db: Db) {
  const values = { code: `EXAME_${randomUUID().slice(0, 8)}`, name: 'Exame Teste' };
  return first(await db.insert(examTypes).values(values).returning());
}

export async function makeAppointment(
  db: Db,
  overrides: Partial<typeof appointments.$inferInsert> = {},
) {
  const values = {
    scheduledAt: new Date('2030-01-10T13:00:00Z'),
    ...overrides,
    createdBy: overrides.createdBy ?? (await makeUser(db, { role: 'CLINIC' })).id,
    patientId: overrides.patientId ?? (await makeUser(db)).id,
    examTypeId: overrides.examTypeId ?? (await makeExamType(db)).id,
  };
  return first(await db.insert(appointments).values(values).returning());
}

type ReportInput = Partial<typeof reports.$inferInsert> &
  Pick<typeof reports.$inferInsert, 'appointmentId' | 'createdBy'>;

export async function makeReport(db: Db, input: ReportInput) {
  const values = {
    title: 'Laudo teste',
    body: 'Texto do laudo de teste.',
    professionalName: 'Dra. Teste',
    ...input,
  };
  return first(await db.insert(reports).values(values).returning());
}
