import { afterAll, beforeEach, inject } from 'vitest';
import { createDb } from '../src/db/client.ts';

export function useTestDb() {
  const conn = createDb(inject('databaseUrl'), { max: 10 });

  beforeEach(async () => {
    await conn.sql`TRUNCATE reports, appointments, exam_types, users CASCADE`;
  });

  afterAll(async () => {
    await conn.close();
  });

  return conn;
}

export async function pgError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    // O Drizzle embrulha o erro do driver em `cause`.
    const pg = (err instanceof Error && err.cause ? err.cause : err) as {
      code?: string;
      constraint_name?: string;
    };
    return { code: pg.code, constraint: pg.constraint_name };
  }
  throw new Error('esperava erro do Postgres');
}
