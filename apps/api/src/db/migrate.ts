import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDb } from './client.ts';

const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url));

/** Aplica as migrations versionadas. Mesma função usada pelo CLI e pelos testes. */
export async function runMigrations(databaseUrl: string): Promise<void> {
  const { db, close } = createDb(databaseUrl, { max: 1 });
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await close();
  }
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida');
  await runMigrations(url);
  process.stdout.write('migrations aplicadas\n');
}
