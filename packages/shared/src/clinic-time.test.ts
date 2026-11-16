import { describe, expect, it } from 'vitest';
import { clinicDate, parseClinicSlot } from './clinic-time.ts';

describe('parseClinicSlot', () => {
  it('converte data e hora de Brasília para o instante UTC', () => {
    expect(parseClinicSlot('2026-11-20', '10:00').toISOString()).toBe('2026-11-20T13:00:00.000Z');
  });
});

describe('clinicDate', () => {
  it('usa o dia de Brasília, não o de UTC', () => {
    // 01:30 UTC do dia 21 = 22:30 do dia 20 em Brasília
    expect(clinicDate(new Date('2026-11-21T01:30:00Z'))).toBe('2026-11-20');
  });
});
