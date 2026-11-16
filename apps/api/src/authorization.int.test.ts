import { randomUUID } from 'node:crypto';
import type { FastifyInstance, HTTPMethods } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildTestApp, loginAs } from '../test/app.ts';
import { useTestDb } from '../test/db.ts';
import { makeUser } from '../test/factories.ts';

// Varre TODAS as rotas registradas: uma rota nova em /clinic ou /patient
// que esqueça a proteção do grupo faz este teste falhar.
describe('Varredura de autorização', () => {
  const { db } = useTestDb();
  const routes: { method: HTTPMethods; url: string }[] = [];
  let app: FastifyInstance;
  let clinicCookie: string;
  let patientCookie: string;

  beforeAll(async () => {
    app = buildTestApp(db);
    app.addHook('onRoute', (route) => {
      for (const method of [route.method].flat()) {
        if (method !== 'HEAD') routes.push({ method, url: route.url.replace(':id', randomUUID()) });
      }
    });
    await app.ready();
  });
  afterAll(() => app.close());

  const call = (method: HTTPMethods, url: string, cookie?: string) =>
    app.inject({ method, url, headers: cookie ? { cookie } : {}, payload: {} });

  it('toda rota /clinic exige login (401) e perfil de clínica (403)', async () => {
    patientCookie = await loginAs(app, (await makeUser(db)).email);
    const clinicRoutes = routes.filter((r) => r.url.startsWith('/clinic'));
    expect(clinicRoutes.length).toBeGreaterThanOrEqual(8);

    for (const { method, url } of clinicRoutes) {
      expect((await call(method, url)).statusCode, `${method} ${url} sem login`).toBe(401);
      expect((await call(method, url, patientCookie)).statusCode, `${method} ${url} paciente`).toBe(
        403,
      );
    }
  });

  it('toda rota /patient exige login (401) e perfil de paciente (403)', async () => {
    clinicCookie = await loginAs(app, (await makeUser(db, { role: 'CLINIC' })).email);
    const patientRoutes = routes.filter((r) => r.url.startsWith('/patient'));
    expect(patientRoutes.length).toBeGreaterThanOrEqual(2);

    for (const { method, url } of patientRoutes) {
      expect((await call(method, url)).statusCode, `${method} ${url} sem login`).toBe(401);
      expect((await call(method, url, clinicCookie)).statusCode, `${method} ${url} clínica`).toBe(
        403,
      );
    }
  });
});
