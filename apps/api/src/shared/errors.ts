import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const unauthenticated = () =>
  new AppError(401, 'UNAUTHENTICATED', 'Autenticação necessária');
export const forbidden = () => new AppError(403, 'FORBIDDEN', 'Acesso negado');
export const notFound = () => new AppError(404, 'NOT_FOUND', 'Recurso não encontrado');

function problem(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  code: string,
  title: string,
  extra: Record<string, unknown> = {},
) {
  return reply
    .status(status)
    .type('application/problem+json')
    .send({ type: 'about:blank', title, status, code, traceId: request.id, ...extra });
}

// Problem Details (RFC 9457). O front decide a mensagem pelo `code`.
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler<FastifyError>((err, request, reply) => {
    if (err instanceof AppError) {
      return problem(request, reply, err.status, err.code, err.message);
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      const errors = err.validation.map((v) => ({ path: v.instancePath, message: v.message }));
      return problem(request, reply, 400, 'VALIDATION_ERROR', 'Dados inválidos', { errors });
    }
    if (err.statusCode === 429) {
      return problem(request, reply, 429, 'RATE_LIMITED', 'Muitas tentativas, aguarde');
    }
    if (err.statusCode && err.statusCode < 500) {
      return problem(request, reply, err.statusCode, 'BAD_REQUEST', 'Requisição inválida');
    }
    request.log.error({ err }, 'erro não tratado');
    return problem(request, reply, 500, 'INTERNAL_ERROR', 'Erro interno');
  });

  app.setNotFoundHandler((request, reply) =>
    problem(request, reply, 404, 'NOT_FOUND', 'Recurso não encontrado'),
  );
}
