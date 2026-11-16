# ADR-008 — Testes de integração com Postgres real

**Status:** aceito

## Contexto

Os cenários obrigatórios dependem de constraints, transações e concorrência.

## Decisão

Vitest + Testcontainers + `app.inject()`, migrations reais, `TRUNCATE` entre testes. Playwright para 3 fluxos E2E.

## Alternativas

- **Mocks de repositório:** não testam a constraint, que é o que importa.
- **pg-mem / SQLite em memória:** sem paridade com Postgres.
- **Banco compartilhado de dev:** estado sujo.
- **Jest / Supertest:** Vitest é mais rápido com ESM/TS; `app.inject()` dispensa Supertest.

## Consequências

Docker necessário para rodar os testes (documentado). Suíte de integração ~15 s.
