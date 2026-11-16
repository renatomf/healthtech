import { createDb } from './client.ts';
import { runMigrations } from './migrate.ts';
import { seed } from './seed.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definida');

const { db, sql, close } = createDb(url);
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
await sql`DROP SCHEMA public CASCADE`;
await sql`CREATE SCHEMA public`;
await runMigrations(url);
await seed(db);
await close();
