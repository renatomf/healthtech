import { afterAll, describe, expect, it } from 'vitest';
import { buildTestApp } from '../test/app.ts';
import { useTestDb } from '../test/db.ts';

describe('API', () => {
  const { db } = useTestDb();
  const app = buildTestApp(db);
  afterAll(() => app.close());

  it('GET /health/live responde ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' });

    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('erros seguem Problem Details com code e traceId igual ao x-request-id', async () => {
    const res = await app.inject({ method: 'GET', url: '/nao-existe' });

    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      traceId: res.headers['x-request-id'],
    });
  });

  it('CORS libera o PUT do laudo para o front (pré-checagem do navegador)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/clinic/appointments/x/report',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type',
      },
    });

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PUT');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
