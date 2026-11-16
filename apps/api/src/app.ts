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
import { AUTH_COOKIE, authenticate, requireRole } from './modules/identity/http/auth-hooks.ts';
import { authRoutes } from './modules/identity/http/auth-routes.ts';
import { patientSearchRoutes } from './modules/identity/http/patient-search-routes.ts';
import { clinicReportRoutes, patientRoutes } from './modules/reports/http/report-routes.ts';
import { schedulingRoutes } from './modules/scheduling/http/scheduling-routes.ts';
import { type Clock, systemClock } from './shared/clock.ts';
import type { Env } from './shared/env.ts';
import { registerErrorHandler } from './shared/errors.ts';

export interface AppDeps {
  env: Env;
  db: Db;
  clock?: Clock;
  logger?: FastifyServerOptions['logger'];
}

export function buildApp({ env, db, clock = systemClock, logger = false }: AppDeps) {
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

  const hours = {
    open: env.CLINIC_OPEN_TIME,
    close: env.CLINIC_CLOSE_TIME,
    timeZone: env.CLINIC_TIMEZONE,
  };

  // Toda rota registrada aqui dentro exige login com perfil CLINIC.
  app.register(
    async (clinic) => {
      clinic.addHook('onRequest', authenticate(db));
      clinic.addHook('onRequest', requireRole('CLINIC'));
      clinic.register(patientSearchRoutes(db));
      clinic.register(schedulingRoutes({ db, clock, hours }));
      clinic.register(clinicReportRoutes({ db, clock }));
    },
    { prefix: '/clinic' },
  );

  // Toda rota registrada aqui dentro exige login com perfil PATIENT.
  app.register(
    async (patient) => {
      patient.addHook('onRequest', authenticate(db));
      patient.addHook('onRequest', requireRole('PATIENT'));
      patient.register(patientRoutes({ db, clock }));
    },
    { prefix: '/patient' },
  );

  return app;
}
