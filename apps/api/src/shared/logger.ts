import type { FastifyServerOptions } from 'fastify';
import type { Env } from './env.ts';

/**
 * Logs sem dados pessoais nem credenciais (SEGURANCA.md §LGPD):
 * cookie, Authorization, senha, e-mail e texto do laudo são censurados.
 */
export function loggerOptions(env: Env): FastifyServerOptions['logger'] {
  return {
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers["set-cookie"]',
        'body.password',
        'body.email',
        'body.body',
      ],
      censor: '[REDACTED]',
    },
  };
}
