import { describe, expect, it } from 'vitest';
import { checkCancel, checkSlot } from './appointment.ts';

const hours = { open: '08:00', close: '18:00', timeZone: 'America/Sao_Paulo' };
// 10/01/2030 10:10 em Brasília
const now = new Date('2030-01-10T13:10:00Z');
const at = (iso: string) => checkSlot(new Date(iso), now, hours);

describe('checkSlot', () => {
  it('aceita slot futuro, alinhado e dentro do horário', () => {
    expect(at('2030-01-10T13:30:00Z')).toBeNull();
  });

  it('rejeita slot que já começou', () => {
    expect(at('2030-01-10T13:00:00Z')).toBe('SLOT_IN_PAST');
  });

  it('rejeita slot fora da grade de 30 minutos', () => {
    expect(at('2030-01-11T13:15:00Z')).toBe('SLOT_NOT_ALIGNED');
    expect(at('2030-01-11T13:00:01Z')).toBe('SLOT_NOT_ALIGNED');
  });

  it('aceita o primeiro (08:00) e o último (17:30) slot do dia', () => {
    expect(at('2030-01-11T11:00:00Z')).toBeNull();
    expect(at('2030-01-11T20:30:00Z')).toBeNull();
  });

  it('rejeita antes da abertura e a partir do fechamento (horário de Brasília)', () => {
    expect(at('2030-01-11T10:30:00Z')).toBe('SLOT_OUTSIDE_BUSINESS_HOURS'); // 07:30
    expect(at('2030-01-11T21:00:00Z')).toBe('SLOT_OUTSIDE_BUSINESS_HOURS'); // 18:00
  });
});

describe('checkCancel', () => {
  it('permite cancelar agendamento sem laudo ou com rascunho', () => {
    expect(checkCancel('SCHEDULED', null)).toBeNull();
    expect(checkCancel('SCHEDULED', 'DRAFT')).toBeNull();
  });

  it('impede cancelar agendamento com laudo publicado', () => {
    expect(checkCancel('SCHEDULED', 'PUBLISHED')).toBe('APPOINTMENT_HAS_PUBLISHED_REPORT');
  });

  it('impede cancelar duas vezes', () => {
    expect(checkCancel('CANCELED', null)).toBe('APPOINTMENT_ALREADY_CANCELED');
  });
});
