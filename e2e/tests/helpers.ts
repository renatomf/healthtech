import { TZDate } from '@date-fns/tz';
import { CLINIC_TIMEZONE, clinicDate } from '@healthtech/shared';
import { expect, type Page } from '@playwright/test';
import { addDays } from 'date-fns';

export const PASSWORD = 'Demo@1234';

/** Dia (YYYY-MM-DD) relativo a hoje no fuso da clínica — o seed usa a mesma referência. */
export function dayFromToday(offset: number) {
  return clinicDate(addDays(new TZDate(new Date(), CLINIC_TIMEZONE), offset));
}

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
