import { afterAll, beforeEach, inject } from 'vitest';
import { createDb } from '../src/db/client.ts';

/**
 * Conexão com o Postgres do Testcontainers + limpeza entre testes.
 * Sem transação-rollback por teste: impediria os testes de concorrência (TESTES.md).
 */
export function useTestDb() {
  const conn = createDb(inject('databaseUrl'), { max: 10 });

  beforeEach(async () => {
    await conn.sql`TRUNCATE reports, appointments, exam_types, users RESTART IDENTITY CASCADE`;
  });

  afterAll(async () => {
    await conn.close();
  });

  return conn;
}

export interface PgErrorInfo {
  code: string | undefined;
  constraint: string | undefined;
}

/** Espera a promessa falhar e devolve o código SQLSTATE e a constraint do erro do Postgres. */
export async function pgError(promise: Promise<unknown>): Promise<PgErrorInfo> {
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
  throw new Error('era esperado um erro do Postgres, mas a operação passou');
}
