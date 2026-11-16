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

_A completar:_ `docker compose up` (caminho principal) e modo local com `pnpm dev`. Requisitos: Docker, Node (ver `.nvmrc`), pnpm via Corepack.

## Banco e dados fictícios

_A completar:_ `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:reset`. O seed é **relativo à data atual**.

## Contas de demonstração

| Conta                | Senha       | Perfil            |
| -------------------- | ----------- | ----------------- |
| `clinica@demo.local` | `Demo@1234` | Equipe da clínica |
| `joao@demo.local`    | `Demo@1234` | Paciente          |
| `maria@demo.local`   | `Demo@1234` | Paciente          |

## Testes

_A completar:_ `pnpm test`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm verify`. Docker é necessário (Testcontainers).

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
