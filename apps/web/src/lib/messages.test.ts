import { describe, expect, it } from 'vitest';
import { ApiError } from './api.ts';
import { errorMessage } from './messages.ts';

describe('errorMessage', () => {
  it('traduz o code da API', () => {
    expect(errorMessage(new ApiError(409, 'SLOT_UNAVAILABLE'))).toBe(
      'Esse horário acabou de ser ocupado. Escolha outro.',
    );
  });

  it('usa mensagem genérica para code desconhecido', () => {
    expect(errorMessage(new ApiError(500, 'INTERNAL_ERROR'))).toBe(
      'Não foi possível concluir. Tente novamente.',
    );
  });

  it('trata falha de rede', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toBe(
      'Sem conexão com o servidor. Tente novamente.',
    );
  });
});
