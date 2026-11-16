import { healthLiveResponse } from '@healthtech/shared';
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

export interface BuildAppOptions {
  logger?: FastifyServerOptions['logger'];
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 100 * 1024,
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/health/live', { schema: { response: { 200: healthLiveResponse } } }, async () => ({
      status: 'ok' as const,
    }));

  return app;
}
