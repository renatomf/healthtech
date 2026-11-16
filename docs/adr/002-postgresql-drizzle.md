# ADR-002 — PostgreSQL com Drizzle

**Status:** aceito

## Contexto

A regra mais avaliada é de concorrência e depende de recursos do banco (índice parcial, CHECK, `FOR UPDATE`, `timestamptz`).

## Decisão

PostgreSQL 16+ com Drizzle ORM. Migrations via `drizzle-kit generate` complementadas por SQL customizado. Nunca `drizzle-kit push`. Driver TCP padrão (`postgres` ou `pg`).

## Alternativas

- **Prisma:** índice parcial, CHECK e `FOR UPDATE` exigem SQL cru; a abstração esconde o que se quer demonstrar.
- **SQL puro com `pg`:** perde tipos inferidos.
- **SQLite:** concorrência e datas fracas.
- **Neon como banco principal:** exige conta/segredo do avaliador; driver HTTP sem transações interativas. Fica só como opção de demo online.

## Consequências

Schema TS e migrations podem divergir no que é customizado. Mitigação: testes de integração rodam as migrations reais.
