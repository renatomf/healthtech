import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.ts';

const valid = {
  NODE_ENV: 'development',
  API_PORT: '3333',
  DATABASE_URL: 'postgres://clinic:secret@localhost:5432/clinic',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '8h',
  WEB_ORIGIN: 'http://localhost:5173',
  LOG_LEVEL: 'info',
  CLINIC_TIMEZONE: 'America/Sao_Paulo',
  CLINIC_OPEN_TIME: '08:00',
  CLINIC_CLOSE_TIME: '18:00',
};

describe('Validação do ambiente no boot', () => {
  it('aceita um ambiente válido e converte a porta para número', () => {
    const env = loadEnv(valid);

    expect(env.API_PORT).toBe(3333);
    expect(env.CLINIC_TIMEZONE).toBe('America/Sao_Paulo');
  });

  it('aplica padrões para porta, expiração, log e horários da clínica', () => {
    const {
      API_PORT: _p,
      JWT_EXPIRES_IN: _j,
      LOG_LEVEL: _l,
      CLINIC_OPEN_TIME: _o,
      CLINIC_CLOSE_TIME: _c,
      ...rest
    } = valid;

    const env = loadEnv(rest);

    expect(env).toMatchObject({
      API_PORT: 3333,
      JWT_EXPIRES_IN: '8h',
      LOG_LEVEL: 'info',
      CLINIC_OPEN_TIME: '08:00',
      CLINIC_CLOSE_TIME: '18:00',
    });
  });

  it('rejeita JWT_SECRET com menos de 32 caracteres', () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: 'curto' })).toThrow(/JWT_SECRET/);
  });

  it('rejeita o segredo de exemplo do .env.example em produção', () => {
    expect(() =>
      loadEnv({
        ...valid,
        NODE_ENV: 'production',
        JWT_SECRET: 'troque-por-um-segredo-aleatorio-de-pelo-menos-32-bytes',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('não expõe o valor do segredo na mensagem de erro', () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: 'segredo-vazado' })).toThrow(
      expect.not.objectContaining({ message: expect.stringContaining('segredo-vazado') }),
    );
  });

  it('rejeita fuso horário inexistente', () => {
    expect(() => loadEnv({ ...valid, CLINIC_TIMEZONE: 'America/Atlantida' })).toThrow(
      /CLINIC_TIMEZONE/,
    );
  });

  it('rejeita DATABASE_URL que não é do Postgres', () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: 'mysql://localhost/clinic' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejeita horário de funcionamento fora da grade de 30 minutos', () => {
    expect(() => loadEnv({ ...valid, CLINIC_OPEN_TIME: '08:15' })).toThrow(/CLINIC_OPEN_TIME/);
  });

  it('rejeita abertura igual ou posterior ao fechamento', () => {
    expect(() =>
      loadEnv({ ...valid, CLINIC_OPEN_TIME: '18:00', CLINIC_CLOSE_TIME: '08:00' }),
    ).toThrow(/CLINIC_CLOSE_TIME/);
  });
});
