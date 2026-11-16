import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

export interface DbOptions {
  /** Tamanho do pool. Testes de concorrência precisam de >= 10 (TESTES.md). */
  max?: number;
}

export function createDb(databaseUrl: string, options: DbOptions = {}) {
  const sql = postgres(databaseUrl, {
    max: options.max ?? 10,
    onnotice: () => {},
  });
  const db = drizzle(sql, { schema });
  return { db, sql, close: () => sql.end({ timeout: 5 }) };
}

export type Db = ReturnType<typeof createDb>['db'];
