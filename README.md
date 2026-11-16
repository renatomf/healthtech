# HealthTech — Agendamento de exames e acesso a laudos

> 🚧 Em construção. Este README é o esqueleto da entrega e será completado ao longo do desenvolvimento (ver `docs/PLANO.md`).

Aplicação web para uma clínica agendar exames, cadastrar laudos (rascunho → publicado) e disponibilizá-los ao paciente.

**Stack:** React + Vite + TypeScript · Fastify + TypeScript · PostgreSQL + Drizzle · Vitest + Testcontainers + Playwright · Docker Compose · pnpm workspaces.

## Sumário

1. [Como executar](#como-executar)
2. [Banco e dados fictícios](#banco-e-dados-fictícios)
3. [Contas de demonstração](#contas-de-demonstração)
4. [Testes](#testes)
5. [Variáveis de ambiente](#variáveis-de-ambiente)
6. [Matriz de requisitos](#matriz-de-requisitos)
7. [Roteiro de avaliação](#roteiro-de-avaliação)
8. [Decisões técnicas](#decisões-técnicas)
9. [Fuso horário adotado](#fuso-horário-adotado)
10. [Limitações e pendências](#limitações-e-pendências)
11. [Tempo dedicado](#tempo-dedicado)
12. [Uso de IA](#uso-de-ia)

## Como executar

Requisitos: Docker; para o modo local, também Node 24 (ver `.nvmrc`) e pnpm via Corepack (`corepack enable`).

**Com Docker (caminho principal)**

```bash
cp .env.example .env
docker compose up --build -d
```

| Serviço    | Endereço                                 |
| ---------- | ---------------------------------------- |
| Web        | http://localhost:5173                    |
| API        | http://localhost:3333 (`/health/live`)   |
| PostgreSQL | `localhost:55432` (`POSTGRES_HOST_PORT`) |

A API aplica as migrations pendentes e valida o `.env` com Zod ao iniciar; não sobe se algo estiver inválido (lista as variáveis com problema, sem repetir valores). O banco usa a porta 55432 no host para não colidir com um Postgres já instalado na máquina.

**Local (desenvolvimento)**

```bash
cp .env.example .env
pnpm install
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev            # API (node --watch) + web (Vite)
```

## Banco e dados fictícios

| Comando            | O que faz                                                                             |
| ------------------ | ------------------------------------------------------------------------------------- |
| `pnpm db:migrate`  | Aplica as migrations versionadas (`apps/api/src/db/migrations`)                       |
| `pnpm db:seed`     | Recria os dados fictícios                                                             |
| `pnpm db:reset`    | Apaga o banco, aplica as migrations e roda o seed                                     |
| `pnpm db:generate` | Gera migration a partir de `schema.ts` (só desenvolvimento; nunca `drizzle-kit push`) |

O seed apaga os dados e recria tudo com datas **relativas a hoje** (fuso da clínica), então funciona em qualquer dia:

```bash
pnpm db:seed                                  # local
docker compose exec api node src/db/seed.ts   # com Docker
```

| Agendamento | Paciente | Quando                 | Estado                                    |
| ----------- | -------- | ---------------------- | ----------------------------------------- |
| A           | João     | ontem 10:00            | agendado, laudo publicado                 |
| B           | João     | ontem 14:00            | agendado, laudo em rascunho               |
| C           | Maria    | ontem 11:00            | agendado, laudo publicado                 |
| D           | Maria    | amanhã 09:00           | cancelado (horário livre para reutilizar) |
| E           | João     | amanhã 10:00           | agendado (horário ocupado)                |
| F           | Maria    | depois de amanhã 15:30 | agendado                                  |

## Contas de demonstração

| Conta                | Senha       | Perfil            |
| -------------------- | ----------- | ----------------- |
| `clinica@demo.local` | `Demo@1234` | Equipe da clínica |
| `joao@demo.local`    | `Demo@1234` | Paciente          |
| `maria@demo.local`   | `Demo@1234` | Paciente          |

## Testes

`pnpm test:unit` (rápido, sem Docker) · `pnpm test:integration` (Postgres real via Testcontainers, exige Docker) · `pnpm test` (ambos) · `pnpm verify` (lint + typecheck + depcruise + testes). `pnpm test:e2e` (Playwright + axe; exige o stack de pé com `docker compose up -d` e o Google Chrome instalado; reseta o banco antes).

## Variáveis de ambiente

Ver [`.env.example`](.env.example).

## Matriz de requisitos

| Requisito                                              | Onde é garantido                 | Teste                |
| ------------------------------------------------------ | -------------------------------- | -------------------- |
| Não agendar no passado                                 | domínio + `Clock`                | Cenário 5            |
| Sem dois agendamentos ativos no mesmo horário          | `uq_active_slot` → 409           | Cenário 1            |
| Reutilizar horário cancelado                           | índice parcial                   | integração           |
| Slots de 30 min                                        | `chk_slot_aligned` + `/slots`    | integração           |
| Um laudo por agendamento                               | `uq_report_appointment`          | integração           |
| Rascunho só para a clínica                             | DTO do paciente + query          | Cenário 3            |
| Publicado disponível ao paciente correto               | query por `patient_id`           | Cenário 4            |
| Paciente não acessa dados de outro                     | escopo na query → 404            | Cenário 2            |
| Publicado não é editável                               | UPDATE condicional + trigger     | integração           |
| Cancelado não recebe laudo / publicado não é cancelado | `FOR UPDATE` + domínio           | integração (corrida) |
| Data de publicação registrada                          | `published_at` + `chk_published` | Cenário 4            |
| Autorização no backend                                 | `requireRole` + escopo           | varredura de rotas   |

## Roteiro de avaliação

_A completar com os passos de `docs/ARQUITETURA.md` e `pnpm demo:race`._

## Decisões técnicas

Resumo em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md); decisões em [`docs/adr/`](docs/adr/); segurança em [`docs/SEGURANCA.md`](docs/SEGURANCA.md); testes em [`docs/TESTES.md`](docs/TESTES.md); interpretações do enunciado em [`docs/INTERPRETACOES.md`](docs/INTERPRETACOES.md).

## Fuso horário adotado

Datas armazenadas em UTC (`timestamptz`). Exibição e cálculo de "dia" sempre em **America/Sao_Paulo (horário de Brasília)**, configurável por `CLINIC_TIMEZONE`, independentemente do fuso do navegador ou do servidor.

## Limitações e pendências

_A completar._ Ver também "Pendências para produção" em `docs/SEGURANCA.md`.

## Tempo dedicado

Ver [`docs/TEMPO.md`](docs/TEMPO.md).

## Uso de IA

Vibe coding é requisito do desafio. Processo, prompts e correções em [`docs/PROCESSO_IA.md`](docs/PROCESSO_IA.md).
