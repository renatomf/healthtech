import { describe, expect, it } from 'vitest';
import { checkCanPublish, checkCanSaveDraft } from './report.ts';

describe('checkCanSaveDraft', () => {
  it('permite criar ou editar rascunho em agendamento ativo', () => {
    expect(checkCanSaveDraft('SCHEDULED', null)).toBeNull();
    expect(checkCanSaveDraft('SCHEDULED', 'DRAFT')).toBeNull();
  });

  it('impede laudo em agendamento cancelado', () => {
    expect(checkCanSaveDraft('CANCELED', null)).toBe('APPOINTMENT_CANCELED');
  });

  it('impede editar laudo publicado', () => {
    expect(checkCanSaveDraft('SCHEDULED', 'PUBLISHED')).toBe('REPORT_ALREADY_PUBLISHED');
  });
});

describe('checkCanPublish', () => {
  it('permite publicar um rascunho', () => {
    expect(checkCanPublish('SCHEDULED', 'DRAFT')).toBeNull();
  });

  it('exige rascunho salvo antes de publicar', () => {
    expect(checkCanPublish('SCHEDULED', null)).toBe('REPORT_DRAFT_REQUIRED');
  });

  it('impede publicar duas vezes e publicar em agendamento cancelado', () => {
    expect(checkCanPublish('SCHEDULED', 'PUBLISHED')).toBe('REPORT_ALREADY_PUBLISHED');
    expect(checkCanPublish('CANCELED', 'DRAFT')).toBe('APPOINTMENT_CANCELED');
  });
});
