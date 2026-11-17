# ADR-009 — Fastify com contratos Zod compartilhados

**Status:** aceito

## Contexto

Front e back precisam concordar sobre formatos, e respostas não podem vazar campos.

## Decisão

Fastify + `fastify-type-provider-zod`; schemas em `packages/shared` usados em validação, serialização e formulários. OpenAPI em `/docs` ficou como pendência (não implementado no prazo).

## Alternativas

- **Express:** sem validação nem tipos nativos.
- **NestJS:** decorators e módulos demais para o prazo.
- **tRPC:** acopla front e back e foge do REST testável com `curl`.

## Consequências

Mudança de contrato quebra a compilação dos dois lados (desejado).

## Escolhas menores (registradas aqui, sem ADR próprio)

Biome em vez de ESLint + Prettier · Tailwind (componentes escritos à mão no estilo shadcn/ui, sem o CLI: só os que a interface usa; o select é próprio, padrão WAI-ARIA combobox, porque a lista do `<select>` nativo não aceita o tema) · TanStack Query · React Router · pnpm workspaces (sem Turborepo).

API roda o `.ts` direto com o type stripping do Node 24 (sem build, sem `tsx`); `packages/shared` exporta o código-fonte. TypeScript 6, não 7: o `dependency-cruiser` ainda não lê projetos TS 7 (analisava 0 módulos).
