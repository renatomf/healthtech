import { expect, test } from '@playwright/test';
import { dayFromToday, login } from './helpers.ts';

const tomorrow = dayFromToday(1);
const yesterday = dayFromToday(-1);

test('clínica agenda um exame e ele aparece na agenda do dia', async ({ page }) => {
  await login(page, 'clinica@demo.local');

  await page.getByRole('navigation').getByRole('link', { name: 'Novo agendamento' }).click();
  await page.getByText('Maria Oliveira').click();
  await page.getByRole('combobox', { name: 'Tipo de exame' }).click();
  await page.getByRole('option', { name: 'Ultrassom' }).click();
  await page.getByLabel('Dia').fill(tomorrow);
  await page.getByRole('button', { name: '08:30' }).click();
  await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

  await expect(page).toHaveURL(`/clinica?data=${tomorrow}`);
  await expect(
    page.getByRole('link', { name: /08:30\s*Maria Oliveira\s*Ultrassom/ }),
  ).toBeVisible();
});

test('laudo vai do rascunho ao paciente', async ({ page }) => {
  await login(page, 'clinica@demo.local');
  await page.goto(`/clinica?data=${yesterday}`);
  await page.getByRole('link', { name: /João da Silva\s*Ultrassom/ }).click();

  await page.getByLabel('Texto do laudo').fill('Fígado de dimensões normais.\nSem alterações.');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page.getByText('Rascunho · visível só para a clínica')).toBeVisible();
  await page.getByRole('button', { name: 'Publicar laudo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText(/Publicado em/)).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await login(page, 'joao@demo.local');
  const exam = page.getByRole('link', { name: /Ultrassom/ });
  await expect(exam).toContainText('Laudo disponível');
  await exam.click();

  await expect(page.getByRole('heading', { name: 'Ultrassom de abdome' })).toBeVisible();
  await expect(page.getByText('Fígado de dimensões normais.')).toBeVisible();
});

test('regras visíveis: horário ocupado desabilitado e cancelamento bloqueado com laudo publicado', async ({
  page,
}) => {
  await login(page, 'clinica@demo.local');

  await page.getByRole('navigation').getByRole('link', { name: 'Novo agendamento' }).click();
  await page.getByLabel('Dia').fill(tomorrow);
  await expect(page.getByRole('button', { name: '10:00' })).toBeDisabled(); // agendamento E
  await expect(page.getByRole('button', { name: '09:00' })).toBeEnabled(); // D cancelado

  await page.goto(`/clinica?data=${yesterday}`);
  await page.getByRole('link', { name: /João da Silva\s*Raio-X/ }).click();
  await expect(page.getByRole('button', { name: 'Cancelar agendamento' })).toBeDisabled();
  await expect(
    page.getByText('Agendamentos com laudo publicado não podem ser cancelados.'),
  ).toBeVisible();
});

test('horários aparecem em Brasília mesmo com o navegador em outro fuso', async ({ page }) => {
  await login(page, 'joao@demo.local');

  // Navegador em Asia/Tokyo (playwright.config.ts); o exame E é às 10:00 de Brasília.
  await expect(page.getByText(/às 10:00/).first()).toBeVisible();
});

test.describe('tema', () => {
  test.use({ colorScheme: 'dark' });

  test('abre no tema claro mesmo com o sistema em modo escuro', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test('filtro de paciente funciona só com o teclado', async ({ page }) => {
  await login(page, 'clinica@demo.local');
  await page.goto(`/clinica?data=${yesterday}`);

  const filter = page.getByRole('combobox', { name: 'Paciente' });
  await filter.focus();
  await page.keyboard.press('ArrowDown'); // abre a lista
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown'); // de "Todos" para o primeiro paciente
  await page.keyboard.press('Enter');

  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(page).toHaveURL(/paciente=/);
  await expect(filter).toHaveText(/João da Silva/);
  await expect(page.getByRole('link', { name: /Maria Oliveira/ })).toHaveCount(0);
});
