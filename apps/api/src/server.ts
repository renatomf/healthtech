import { buildApp } from './app.ts';
import { loadEnv } from './shared/env.ts';
import { loggerOptions } from './shared/logger.ts';

const env = loadEnv(process.env);
const app = buildApp({ logger: loggerOptions(env) });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'encerrando');
    app.close().then(
      () => process.exit(0),
      (err: unknown) => {
        app.log.error({ err }, 'falha ao encerrar');
        process.exit(1);
      },
    );
  });
}

try {
  await app.listen({ host: '0.0.0.0', port: env.API_PORT });
} catch (err) {
  app.log.error({ err }, 'falha ao iniciar a API');
  process.exit(1);
}
