import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.ts';

const valid = {
  DATABASE_URL: 'postgres://clinic:secret@localhost:5432/clinic',
  JWT_SECRET: 'a'.repeat(32),
  WEB_ORIGIN: 'http://localhost:5173',
};

describe('loadEnv', () => {
  it('aplica os padrões e converte a porta para número', () => {
    const env = loadEnv(valid);

    expect(env).toMatchObject({ API_PORT: 3333, CLINIC_TIMEZONE: 'America/Sao_Paulo' });
  });

  it('rejeita JWT_SECRET com menos de 32 caracteres', () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: 'curto' })).toThrow('JWT_SECRET');
  });

  it('não expõe valores na mensagem de erro', () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: 'segredo-vazado' })).toThrow(
      'Variáveis de ambiente inválidas: JWT_SECRET',
    );
  });
});
