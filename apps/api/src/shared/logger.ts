import type { FastifyServerOptions } from 'fastify';
import type { Env } from './env.ts';

export function loggerOptions(env: Env): FastifyServerOptions['logger'] {
  return {
    level: env.LOG_LEVEL,
    redact: [
      'req.headers.cookie',
      'req.headers.authorization',
      'body.password',
      'body.email',
      'body.body',
    ],
  };
}
