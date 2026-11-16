import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().default(3333),
  DATABASE_URL: z.string().startsWith('postgres'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),
  WEB_ORIGIN: z.url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CLINIC_TIMEZONE: z.string().default('America/Sao_Paulo'),
  CLINIC_OPEN_TIME: z.string().default('08:00'),
  CLINIC_CLOSE_TIME: z.string().default('18:00'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // Só os nomes das variáveis: os valores podem conter segredos.
    const names = result.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(`Variáveis de ambiente inválidas: ${names.join(', ')}`);
  }
  return result.data;
}
