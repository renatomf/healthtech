import { defineConfig } from 'drizzle-kit';

// Só `drizzle-kit generate` (nunca `push`, ADR-002). A aplicação das migrations
// é feita por src/db/migrate.ts, o mesmo código usado nos testes de integração.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  strict: true,
});
