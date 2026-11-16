import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { dayFromToday, login } from './helpers.ts';

async function expectAccessible(page: Page, screen: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    serious.map((v) => `${screen}: ${v.id} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`acessibilidade (tema ${theme === 'light' ? 'claro' : 'escuro'})`, () => {
    test.use({ colorScheme: theme });

    test('login', async ({ page }) => {
      await page.goto('/login');
      await expectAccessible(page, 'login');
    });

    test('telas da clínica', async ({ page }) => {
      await login(page, 'clinica@demo.local');
      await page.goto(`/clinica?data=${dayFromToday(-1)}`);
      await expect(page.getByText('Agendamentos do dia')).toBeVisible();
      await expectAccessible(page, 'agenda');

      await page.getByRole('link', { name: /João da Silva\s*Raio-X/ }).click();
      await expect(page.getByRole('heading', { name: 'Laudo' })).toBeVisible();
      await expectAccessible(page, 'detalhe');

      await page.goto('/clinica/agendamentos/novo');
      await page.getByLabel('Dia').fill(dayFromToday(1));
      await expect(page.getByRole('button', { name: '09:00' })).toBeVisible();
      await expectAccessible(page, 'novo agendamento');
    });

    test('telas do paciente', async ({ page }) => {
      await login(page, 'joao@demo.local');
      await expect(page.getByText('Meus exames')).toBeVisible();
      await expectAccessible(page, 'paciente');

      await page.getByRole('link', { name: /Raio-X/ }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectAccessible(page, 'laudo');
    });
  });
}
