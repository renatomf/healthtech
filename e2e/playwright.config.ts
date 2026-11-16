import { defineConfig } from '@playwright/test';

// Roda contra o stack do Docker Compose (web em :5173, API em :3333).
// Os testes alteram o banco: um worker só, e `pnpm db:reset` antes (global-setup).
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    channel: 'chrome',
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    // Fuso diferente do da clínica, para provar que a tela não usa o fuso do navegador.
    timezoneId: 'Asia/Tokyo',
  },
});
