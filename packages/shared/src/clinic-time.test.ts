import { describe, expect, it } from 'vitest';
import {
  clinicDate,
  clinicDayRange,
  clinicTime,
  listClinicSlots,
  parseClinicSlot,
} from './clinic-time.ts';

describe('parseClinicSlot', () => {
  it('converte data e hora de Brasília para o instante UTC', () => {
    expect(parseClinicSlot('2026-11-20', '10:00').toISOString()).toBe('2026-11-20T13:00:00.000Z');
  });
});

describe('clinicDate e clinicTime', () => {
  it('usam o dia e a hora de Brasília, não os de UTC', () => {
    // 01:30 UTC do dia 21 = 22:30 do dia 20 em Brasília
    const instant = new Date('2026-11-21T01:30:00Z');

    expect(clinicDate(instant)).toBe('2026-11-20');
    expect(clinicTime(instant)).toBe('22:30');
  });
});

describe('clinicDayRange', () => {
  it('vai da meia-noite à meia-noite seguinte em Brasília', () => {
    const { start, end } = clinicDayRange('2026-11-20');

    expect(start.toISOString()).toBe('2026-11-20T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-11-21T03:00:00.000Z');
  });
});

describe('listClinicSlots', () => {
  it('gera slots de 30 minutos da abertura até 30 minutos antes do fechamento', () => {
    const slots = listClinicSlots('2026-11-20', '08:00', '18:00');

    expect(slots).toHaveLength(20);
    expect(slots[0]?.toISOString()).toBe('2026-11-20T11:00:00.000Z');
    expect(slots.at(-1)?.toISOString()).toBe('2026-11-20T20:30:00.000Z');
  });
});
