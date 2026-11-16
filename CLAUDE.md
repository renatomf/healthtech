# CLAUDE.md

@AGENTS.md

## Contexto do projeto (HealthTech)

Desafio técnico (vaga de engenharia, nível sênior): aplicação web para uma clínica agendar exames, cadastrar laudos e disponibilizá-los ao paciente. Prazo: 3 dias. **Vibe coding é requisito da entrega** — todo uso de IA deve ser registrado em `docs/PROCESSO_IA.md`.

Leia antes de qualquer tarefa, nesta ordem:

1. `docs/ENUNCIADO.md` — requisitos oficiais (fonte da verdade).
2. `docs/INTERPRETACOES.md` — decisões sobre ambiguidades do enunciado.
3. `docs/ARQUITETURA.md` — arquitetura, modelo de dados, constraints, concorrência, fuso, API.
4. `docs/SEGURANCA.md` — autenticação, autorização, ameaças, LGPD.
5. `docs/TESTES.md` — estratégia e cenários obrigatórios.
6. `docs/adr/` — decisões técnicas (não contrarie um ADR sem propor um novo).
7. `docs/PLANO.md` — plano de 3 dias e checklist (marque o que concluir).

## Stack (fechada — ver ADRs)

- Monorepo **pnpm workspaces**: `apps/api`, `apps/web`, `packages/shared`, `e2e/`.
- Backend: **Node.js + TypeScript + Fastify** + `fastify-type-provider-zod` + `@fastify/swagger`.
- Banco: **PostgreSQL 16+** com **Drizzle ORM** (migrations versionadas; SQL customizado para índices parciais, CHECKs e trigger; nunca `drizzle-kit push`).
- Auth: JWT HS256 em cookie `httpOnly` (`@fastify/jwt` + `@fastify/cookie`), senha com `bcryptjs`, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/cors`.
- Frontend: **React + TypeScript + Vite**, React Router, TanStack Query, React Hook Form + Zod, Tailwind + shadcn/ui, `date-fns` + `@date-fns/tz`.
- Testes: **Vitest** (unit + integração com `app.inject()` e **Testcontainers** Postgres), Testing Library + MSW no front, **Playwright** E2E (+ `@axe-core/playwright`).
- Qualidade: TypeScript `strict`, **Biome**, `dependency-cruiser`, GitHub Actions.
- Infra local: **Docker Compose** (db, api, web).

## Comandos (a criar e manter funcionando)

```
pnpm dev            # api + web em modo desenvolvimento
pnpm db:migrate     # aplica migrations
pnpm db:seed        # dados fictícios RELATIVOS à data atual
pnpm db:reset       # drop + migrate + seed
pnpm test           # todos os testes (exige Docker para Testcontainers)
pnpm test:unit      # só unitários (rápido, ciclo TDD)
pnpm test:e2e       # Playwright
pnpm demo:race      # 10 reservas simultâneas contra a API rodando
pnpm verify         # biome check + typecheck + depcruise + testes
```

## Como trabalhar neste repositório

- Siga `docs/PLANO.md` em ordem. Testes obrigatórios **antes** da implementação (commit vermelho, depois verde).
- Uma tarefa = um commit pequeno, mensagem em Conventional Commits (`feat(scheduling): ...`).
- Ao terminar uma tarefa: `pnpm verify` precisa passar.
- Se a IA (você) propuser algo que contradiz `docs/` ou um ADR, pare e explique o conflito antes de implementar.
- Registre em `docs/PROCESSO_IA.md` erros relevantes que você cometeu e foram corrigidos (o autor humano revisa).
