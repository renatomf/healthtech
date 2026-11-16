# ADR-010 — API executada com type stripping nativo do Node; TypeScript 6

**Status:** aceito

## Contexto

A API é TypeScript. Opções para rodá-la: compilar (`tsc`/bundler), usar um loader (`tsx`) ou o type stripping nativo do Node 24. Ao mesmo tempo, o TypeScript 7 (compilador nativo) acabou de sair, e nem todas as ferramentas usam a API dele.

## Decisão

- A API roda com `node src/server.ts` (dev: `node --watch`), sem etapa de build. O `tsc` só faz checagem de tipos (`noEmit`).
- `tsconfig` com `erasableSyntaxOnly`, `verbatimModuleSyntax` e `allowImportingTsExtensions`: imports relativos com extensão `.ts`, sem `enum`/`namespace`/parameter properties.
- `packages/shared` exporta o código-fonte `.ts` direto (sem build), consumido pela API (Node), pelo Vite e pelo Vitest.
- **TypeScript 6.x**, não 7: o `dependency-cruiser` ainda não suporta a API do TS 7 e, com ele, analisava 0 módulos sem dar erro (a guarda de arquitetura passava sem verificar nada).

## Alternativas

- **`tsx`:** dependência a mais para algo que o Node já faz.
- **Build com `tsc`/`tsup`:** etapa extra e mapeamento de caminhos para o pacote compartilhado.
- **TypeScript 7:** typecheck mais rápido, mas quebra silenciosamente o `dependency-cruiser`.

## Consequências

Menos dependências e nenhum artefato gerado. Migrar para TS 7 quando o `dependency-cruiser` suportá-lo (basta trocar a versão e conferir se `pnpm depcruise` cruza mais de 0 módulos).
