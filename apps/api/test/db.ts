import { afterAll, beforeEach, inject } from 'vitest';
import { createDb } from '../src/db/client.ts';
import { pgErrorOf } from '../src/db/pg-error.ts';

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
    return pgErrorOf(err);
  }
  throw new Error('esperava erro do Postgres');
}
