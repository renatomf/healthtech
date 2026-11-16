import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';

describe('Saúde da API', () => {
  const app = buildApp();
  afterEach(async () => {
    await app.close();
  });

  it('GET /health/live responde 200 com status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
