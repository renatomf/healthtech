import { buildApp } from './app.ts';
import { createDb } from './db/client.ts';
import { loadEnv } from './shared/env.ts';
import { loggerOptions } from './shared/logger.ts';

const env = loadEnv(process.env);
const { db, close } = createDb(env.DATABASE_URL);
const app = buildApp({ env, db, logger: loggerOptions(env) });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await close();
    process.exit(0);
  });
}

try {
  await app.listen({ host: '0.0.0.0', port: env.API_PORT });
} catch (err) {
  app.log.error({ err }, 'falha ao iniciar a API');
  process.exit(1);
}
