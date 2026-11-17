import { TZDate } from '@date-fns/tz';
import { CLINIC_TIMEZONE, clinicDate } from '@healthtech/shared';
import { expect, type Page } from '@playwright/test';
import { addDays } from 'date-fns';

export const PASSWORD = 'Demo@1234';

/** Dia (YYYY-MM-DD) relativo a hoje no fuso da clínica — o seed usa a mesma referência. */
export function dayFromToday(offset: number) {
  return clinicDate(addDays(new TZDate(new Date(), CLINIC_TIMEZONE), offset));
}

type Cookie = Awaited<ReturnType<ReturnType<Page['context']>['cookies']>>[number];
const sessions = new Map<string, Cookie[]>();

/**
 * Primeiro login de cada conta passa pela tela; os seguintes reaproveitam o cookie.
 * Sem isso a suíte esbarra no rate limit do login (5/min por IP + e-mail), que é
 * uma regra de segurança da API e não deve ser afrouxada para os testes.
 */
export async function login(page: Page, email: string) {
  const saved = sessions.get(email);
  if (saved) {
    await page.context().addCookies(saved);
    await page.goto('/');
  } else {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
  }
  await expect(page).not.toHaveURL(/\/login/);
  if (!saved) sessions.set(email, await page.context().cookies());
}
