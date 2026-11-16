import { ApiError } from './api.ts';

// O front decide a mensagem pelo `code` do erro, nunca pelo texto da API.
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  RATE_LIMITED: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
  SLOT_UNAVAILABLE: 'Esse horário acabou de ser ocupado. Escolha outro.',
  SLOT_IN_PAST: 'Esse horário já passou. Escolha outro.',
  SLOT_NOT_ALIGNED: 'Escolha um dos horários da lista.',
  SLOT_OUTSIDE_BUSINESS_HOURS: 'Fora do horário de funcionamento da clínica.',
  PATIENT_NOT_FOUND: 'Paciente não encontrado.',
  EXAM_TYPE_NOT_FOUND: 'Tipo de exame não encontrado.',
  APPOINTMENT_ALREADY_CANCELED: 'Este agendamento já foi cancelado.',
  APPOINTMENT_HAS_PUBLISHED_REPORT: 'Agendamentos com laudo publicado não podem ser cancelados.',
  APPOINTMENT_CANCELED: 'Agendamentos cancelados não podem receber laudo.',
  REPORT_ALREADY_PUBLISHED: 'Este laudo já foi publicado e não pode ser alterado.',
  REPORT_DRAFT_REQUIRED: 'Salve o rascunho antes de publicar.',
  VALIDATION_ERROR: 'Confira os campos preenchidos.',
  NOT_FOUND: 'Não encontrado.',
  FORBIDDEN: 'Você não tem acesso a esta área.',
  UNAUTHENTICATED: 'Sua sessão expirou. Entre novamente.',
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return MESSAGES[err.code] ?? 'Não foi possível concluir. Tente novamente.';
  }
  return 'Sem conexão com o servidor. Tente novamente.';
}
