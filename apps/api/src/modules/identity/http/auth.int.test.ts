import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, loginAs } from '../../../../test/app.ts';
import { useTestDb } from '../../../../test/db.ts';
import { makeUser } from '../../../../test/factories.ts';
import { users } from '../../../db/schema.ts';
import { authenticate, requireRole } from './auth-hooks.ts';

describe('Autenticação', () => {
  const { db } = useTestDb();
  let app: FastifyInstance;

  beforeEach(() => {
    app = buildTestApp(db);
  });
  afterEach(() => app.close());

  const login = (payload: object) => app.inject({ method: 'POST', url: '/auth/login', payload });

  it('login válido devolve o usuário e grava o token em cookie httpOnly', async () => {
    const user = await makeUser(db, { email: 'joao@demo.local' });

    const res = await login({ email: 'JOAO@demo.local', password: 'Senha@123' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      id: user.id,
      name: user.name,
      email: 'joao@demo.local',
      role: 'PATIENT',
    });
    const cookie = res.cookies.find((c) => c.name === 'token');
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' });
  });

  it('senha errada e e-mail inexistente recebem a mesma resposta', async () => {
    await makeUser(db, { email: 'joao@demo.local' });

    const wrongPassword = await login({ email: 'joao@demo.local', password: 'errada' });
    const unknownEmail = await login({ email: 'ninguem@demo.local', password: 'errada' });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        title: 'Credenciais inválidas',
      });
      expect(res.cookies).toHaveLength(0);
    }
  });

  it('rejeita campos extras no corpo do login', async () => {
    const res = await login({ email: 'joao@demo.local', password: 'x', role: 'CLINIC' });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('bloqueia a 6ª tentativa de login em um minuto', async () => {
    const attempts = [];
    for (let i = 0; i < 6; i++) {
      attempts.push(await login({ email: 'joao@demo.local', password: 'errada' }));
    }

    expect(attempts.map((r) => r.statusCode)).toEqual([401, 401, 401, 401, 401, 429]);
    expect(attempts[5]?.json()).toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('GET /auth/me devolve o usuário logado', async () => {
    const user = await makeUser(db, { role: 'CLINIC' });
    const cookie = await loginAs(app, user.email);

    const res = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id: user.id, role: 'CLINIC' });
  });

  it('GET /auth/me sem cookie responde 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('token com assinatura inválida responde 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: 'token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.assinatura-falsa' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('perfil é conferido no banco: usuário rebaixado perde o acesso de clínica na hora', async () => {
    app.register(
      async (clinic) => {
        clinic.addHook('onRequest', authenticate(db));
        clinic.addHook('onRequest', requireRole('CLINIC'));
        clinic.get('/ping', async () => ({ ok: true }));
      },
      { prefix: '/clinic' },
    );
    const user = await makeUser(db, { role: 'CLINIC' });
    const cookie = await loginAs(app, user.email);
    const ping = () => app.inject({ method: 'GET', url: '/clinic/ping', headers: { cookie } });

    expect((await ping()).statusCode).toBe(200);

    await db.update(users).set({ role: 'PATIENT' }).where(eq(users.id, user.id));
    const res = await ping();

    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ code: 'FORBIDDEN' });
  });

  it('logout apaga o cookie', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' });

    expect(res.statusCode).toBe(204);
    expect(res.cookies.find((c) => c.name === 'token')?.value).toBe('');
  });
});
