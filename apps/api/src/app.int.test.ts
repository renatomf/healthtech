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
});
