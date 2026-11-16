import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { healthLiveResponse } from '@healthtech/shared';
import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Db } from './db/client.ts';
import { AUTH_COOKIE } from './modules/identity/http/auth-hooks.ts';
import { authRoutes } from './modules/identity/http/auth-routes.ts';
import type { Env } from './shared/env.ts';
import { registerErrorHandler } from './shared/errors.ts';

export interface AppDeps {
  env: Env;
  db: Db;
  logger?: FastifyServerOptions['logger'];
}

export function buildApp({ env, db, logger = false }: AppDeps) {
  const app = Fastify({
    logger,
    bodyLimit: 100 * 1024,
    genReqId: () => randomUUID(),
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandler(app);

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.register(helmet);
  app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  app.register(cookie);
  app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: AUTH_COOKIE, signed: false },
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });
  app.register(rateLimit, { global: false });

  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/health/live', { schema: { response: { 200: healthLiveResponse } } }, async () => ({
      status: 'ok' as const,
    }));

  app.register(authRoutes(db, env));

  return app;
}
