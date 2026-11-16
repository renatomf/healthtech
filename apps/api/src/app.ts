import { healthLiveResponse } from '@healthtech/shared';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/health/live', { schema: { response: { 200: healthLiveResponse } } }, async () => ({
      status: 'ok' as const,
    }));

  return app;
}
