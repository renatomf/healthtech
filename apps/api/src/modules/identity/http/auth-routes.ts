import { loginRequest, userResponse } from '@healthtech/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { Db } from '../../../db/client.ts';
import type { Env } from '../../../shared/env.ts';
import { login } from '../application/login.ts';
import { AUTH_COOKIE, authenticate } from './auth-hooks.ts';

export function authRoutes(db: Db, env: Env): FastifyPluginAsyncZod {
  return async (app) => {
    app.post(
      '/auth/login',
      {
        schema: { body: loginRequest, response: { 200: userResponse } },
        config: {
          rateLimit: {
            max: 5,
            timeWindow: '1 minute',
            hook: 'preHandler', // depois da validação, para usar o e-mail na chave
            keyGenerator: (req) => `${req.ip}:${(req.body as { email: string }).email}`,
          },
        },
      },
      async (request, reply) => {
        const user = await login(db, request.body.email, request.body.password);
        const token = await reply.jwtSign({ sub: user.id, role: user.role });
        reply.setCookie(AUTH_COOKIE, token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: env.NODE_ENV === 'production',
          path: '/',
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    );

    app.post('/auth/logout', async (_request, reply) => {
      reply.clearCookie(AUTH_COOKIE, { path: '/' });
      return reply.status(204).send();
    });

    app.get(
      '/auth/me',
      { onRequest: authenticate(db), schema: { response: { 200: userResponse } } },
      async (request) => request.user,
    );
  };
}
