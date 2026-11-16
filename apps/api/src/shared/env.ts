import { z } from 'zod';

const EXAMPLE_JWT_SECRET = 'troque-por-um-segredo-aleatorio-de-pelo-menos-32-bytes';

/** HH:MM em :00 ou :30 — a grade de slots é fixa em 30 min (chk_slot_aligned). */
const slotTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):(00|30)$/, 'use HH:MM com minutos 00 ou 30 (slots fixos de 30 min)');

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3333),
    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'precisa ser uma URL postgres:// ou postgresql://'),
    JWT_SECRET: z.string().min(32, 'precisa ter pelo menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().min(1).default('8h'),
    WEB_ORIGIN: z.url(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CLINIC_TIMEZONE: z.string().refine(isValidTimeZone, 'fuso horário IANA inválido'),
    CLINIC_OPEN_TIME: slotTime.default('08:00'),
    CLINIC_CLOSE_TIME: slotTime.default('18:00'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.JWT_SECRET === EXAMPLE_JWT_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'o segredo de exemplo do .env.example não pode ser usado em produção',
      });
    }
    // HH:MM com zero à esquerda: a comparação de strings equivale à de horários.
    if (env.CLINIC_OPEN_TIME >= env.CLINIC_CLOSE_TIME) {
      ctx.addIssue({
        code: 'custom',
        path: ['CLINIC_CLOSE_TIME'],
        message: 'precisa ser posterior a CLINIC_OPEN_TIME',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Valida as variáveis de ambiente. Falha no boot com a lista de problemas,
 * sem repetir os valores recebidos (que podem conter segredos).
 */
export function loadEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${problems}`);
  }
  return result.data;
}
