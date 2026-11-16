import type { FastifyInstance } from 'fastify';
import { inject } from 'vitest';
import { buildApp } from '../src/app.ts';
import type { Db } from '../src/db/client.ts';
import { loadEnv } from '../src/shared/env.ts';
import { TEST_PASSWORD } from './factories.ts';

export function buildTestApp(db: Db) {
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: inject('databaseUrl'),
    JWT_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres',
    WEB_ORIGIN: 'http://localhost:5173',
  });
  return buildApp({ env, db });
}

/** Faz login e devolve o cookie para usar nas próximas requisições. */
export async function loginAs(app: FastifyInstance, email: string, password = TEST_PASSWORD) {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
  const cookie = res.cookies.find((c) => c.name === 'token');
  if (!cookie) throw new Error(`login falhou para ${email}: ${res.statusCode}`);
  return `token=${cookie.value}`;
}
