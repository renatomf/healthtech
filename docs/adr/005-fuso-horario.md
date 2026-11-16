# ADR-005 — Fuso horário da clínica

**Status:** aceito

## Contexto

O enunciado pede exibição consistente e fuso documentado.

## Decisão

Armazenamento em UTC (`timestamptz`). Exibição e cálculo de "dia" em `CLINIC_TIMEZONE=America/Sao_Paulo`. Utilitários centralizados em `packages/shared` (`date-fns` + `@date-fns/tz`). Filtro por data usa o intervalo do dia no fuso da clínica.

## Alternativas

- **Fuso do navegador:** o mesmo agendamento apareceria diferente para clínica e paciente.
- **`timestamp` sem fuso:** ambíguo.

## Consequências

Uma clínica, um fuso. CI roda testes com `TZ=UTC` e `TZ=Asia/Tokyo` para provar independência do fuso do servidor.
