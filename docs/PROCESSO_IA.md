# Processo com IA (vibe coding)

> Preencher **durante** o trabalho, não depois. É uma das partes mais importantes da entrega.

## Ferramentas

| Ferramenta            | Uso                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------- |
| Claude (chat)         | Brainstorming de arquitetura, revisão de decisões, documentação inicial (`docs/`, ADRs) |
| Claude Code (VS Code) | Implementação guiada por `CLAUDE.md` / `AGENTS.md`, testes, refatoração                 |
|                       |                                                                                         |

## Fluxo de trabalho

1. Requisitos e decisões escritos primeiro (`docs/`).
2. Testes obrigatórios escritos antes da implementação (commit vermelho).
3. Implementação pela IA, uma tarefa do `PLANO.md` por vez.
4. Revisão manual linha a linha das áreas críticas (abaixo).
5. `pnpm verify` antes de cada commit.

## Prompts principais

| #   | Objetivo                | Prompt (resumo)                                                                                                                      | Resultado                                                                                                                                                  |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Iniciar o projeto       | "vamos iniciar o projeto seguindo o roadmap já criado"                                                                               | Leitura de `docs/` e ADRs; monorepo pnpm (tarefa 1 do Dia 1) com `pnpm verify` verde                                                                       |
| 2   | Direção visual do front | Mockups de referência ("care 1" e "care 2"): layout elegante, sem degradê exagerado, light/dark mode                                 | Diretrizes em `ARQUITETURA.md` §Identidade visual, a aplicar no Dia 2                                                                                      |
| 3   | Etapa 2 do Dia 1        | "etapa 2 siga"                                                                                                                       | Compose (db, api, web), `.env` validado por Zod, logger com redação; testado com `docker compose up`                                                       |
| 4   | Etapa 3 do Dia 1        | "siga em frente"                                                                                                                     | Schema Drizzle, migrations (gerada + trigger), Testcontainers e 15 testes de constraints; porta do banco movida para 55432 por conflito com Postgres local |
| 5   | Revisão de estilo       | "até aqui está muito overengineering" / "o código é compreensível ou muito feito por IA?" / "siga simples da maneira que planejamos" | Limpeza (−600 linhas) e seed com utilitários de fuso testados antes (TDD)                                                                                  |
| 6   | Autenticação            | "siga" (direto no `main`)                                                                                                            | Testes de login, me, logout, rate limit e perfil conferido no banco escritos antes; depois o módulo `identity`                                             |

## Onde a IA errou e como foi corrigido

| #   | O que a IA sugeriu                                                                     | Por que estava errado                                                                                                                  | Correção                                                 | Commit            |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------- |
| 1   | Índice único em `scheduled_at` sem considerar duração/salas (no brainstorming inicial) | Correto aqui (1 sala, slots fixos), mas a justificativa precisava ser explícita                                                        | ADR-003 documenta quando trocar por exclusion constraint | —                 |
| 2   | Usar TypeScript 7 (versão mais recente) no monorepo                                    | `dependency-cruiser` não suporta a API do TS 7: só avisou e cruzou 0 módulos, então as regras de arquitetura passariam sem checar nada | Fixado TypeScript 6.x; registrado no ADR-009             | `chore: monorepo` |

## Revisado linha a linha

- Autorização (hooks, escopo das queries, DTOs)
- Constraints, migrations e trigger
- Transações e `FOR UPDATE`
- Tratamento de fuso horário

## Proporção

Aproximadamente __% do código gerado por IA; __% do tempo em revisão e correção.
