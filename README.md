# HealthTech — Agendamento de exames e acesso a laudos

[![CI](https://github.com/renatomf/healthtech/actions/workflows/ci.yml/badge.svg)](https://github.com/renatomf/healthtech/actions/workflows/ci.yml)

Aplicação web para uma clínica agendar exames, cadastrar laudos (rascunho → publicado) e disponibilizá-los ao paciente.

**Em uma frase:** as regras críticas (horário único, laudo imutável, paciente só vê o que é dele) são garantidas pelo banco e pela consulta, não só pela tela, e cada uma tem um teste que a prova — inclusive sob concorrência e com o servidor em outro fuso.

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
docker compose exec api node src/db/seed.ts   # contas e dados de demonstração
```

Abra http://localhost:5173 e entre com uma das [contas de demonstração](#contas-de-demonstração).

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

| Comando                 | O que roda                                                                                                                          | Requisitos                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `pnpm test:unit`        | Regras de domínio, fuso, mensagens do front                                                                                         | —                                                    |
| `pnpm test:integration` | API + Postgres real (Testcontainers, migrations reais): os 5 cenários do enunciado, corridas, constraints, varredura de autorização | Docker                                               |
| `pnpm test`             | Os dois acima                                                                                                                       | Docker                                               |
| `pnpm verify`           | Biome + typecheck + dependency-cruiser + `pnpm test`                                                                                | Docker                                               |
| `pnpm test:e2e`         | Playwright: 3 fluxos + navegador em `Asia/Tokyo` + axe em 6 telas nos temas claro e escuro (reseta o banco antes)                   | Stack no ar (`docker compose up -d`) e Google Chrome |
| `pnpm demo:race`        | 10 reservas simultâneas do mesmo horário contra a API rodando: 1 aceita, 9 × 409                                                    | Stack no ar com seed                                 |

Os 5 cenários do enunciado estão em `describe('Cenário N — …')`: [agendamento](apps/api/src/modules/scheduling/http/scenarios.int.test.ts) (1 e 5) e [laudos](apps/api/src/modules/reports/http/scenarios.int.test.ts) (2, 3 e 4). O CI roda tudo com `TZ=UTC` e com `TZ=Asia/Tokyo`.

## Variáveis de ambiente

Exemplo completo, sem segredos reais, em [`.env.example`](.env.example). A API valida tudo com Zod ao iniciar.

| Variável                                            | Padrão / exemplo                      | Uso                                                           |
| --------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `clinic` / … / `clinic`               | Banco do Compose                                              |
| `POSTGRES_HOST_PORT`                                | `55432`                               | Porta do banco no host                                        |
| `DATABASE_URL`                                      | `postgres://…@localhost:55432/clinic` | Conexão da API (no Compose é sobrescrita para o serviço `db`) |
| `JWT_SECRET`                                        | ≥ 32 caracteres                       | Assinatura do token. **Troque em produção**                   |
| `JWT_EXPIRES_IN`                                    | `8h`                                  | Validade da sessão                                            |
| `WEB_ORIGIN`                                        | `http://localhost:5173`               | Única origem liberada no CORS                                 |
| `CLINIC_TIMEZONE`                                   | `America/Sao_Paulo`                   | Fuso de exibição e de "dia"                                   |
| `CLINIC_OPEN_TIME` / `CLINIC_CLOSE_TIME`            | `08:00` / `18:00`                     | Funcionamento (último horário 17:30)                          |
| `VITE_API_URL`                                      | `http://localhost:3333`               | URL da API usada pelo front (no build)                        |

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

Roteiro completo, passo a passo e com o resultado esperado de cada ação: **[`docs/ROTEIRO_TESTE.md`](docs/ROTEIRO_TESTE.md)** (~20 min). Versão curta, com o stack no ar e o seed carregado (~10 min):

1. **Clínica** — entre como `clinica@demo.local`. No calendário, escolha **ontem**: A (João, publicado), B (João, rascunho) e C (Maria, publicado).
2. **Rascunho → publicado** — abra B, edite o texto, _Salvar rascunho_ e _Publicar laudo_ (com confirmação). Os campos travam e aparece a data de publicação.
3. **Paciente** — saia e entre como `joao@demo.local`: o Ultrassom agora mostra **Laudo disponível**; abra e leia. Entre como `maria@demo.local`: ela não vê nada do João.
4. **Publicado não cancela** — como clínica, abra A: _Cancelar agendamento_ está bloqueado (a API também recusa: 409 `APPOINTMENT_HAS_PUBLISHED_REPORT`).
5. **Horários** — _Novo agendamento_ para **amanhã**: 10:00 aparece ocupado (E); 09:00 está livre porque D foi cancelado; horários de hoje que já passaram aparecem riscados.
6. **Concorrência** — `pnpm demo:race`: 10 reservas simultâneas, 1 aceita e 9 × 409.
7. **API direto** — [`docs/api/api.http`](docs/api/api.http) (REST Client): paciente lendo laudo de outro → 404; perfil errado → 403; sem login → 401; campo extra → 400; `traceId` = `x-request-id`.
8. **Fuso** — os horários são sempre de Brasília: mude o fuso do computador e recarregue, ou veja o teste E2E que roda o navegador em `Asia/Tokyo`.
9. **Visual** — alterne claro/escuro no canto da tela; abra no celular (ou DevTools em 390 px).

## Decisões técnicas

Resumo em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md); decisões em [`docs/adr/`](docs/adr/); segurança em [`docs/SEGURANCA.md`](docs/SEGURANCA.md); testes em [`docs/TESTES.md`](docs/TESTES.md); interpretações do enunciado em [`docs/INTERPRETACOES.md`](docs/INTERPRETACOES.md).

## Fuso horário adotado

Datas armazenadas em UTC (`timestamptz`). Exibição e cálculo de "dia" sempre em **America/Sao_Paulo (horário de Brasília)**, configurável por `CLINIC_TIMEZONE`, independentemente do fuso do navegador ou do servidor.

## Limitações e pendências

**Limitações conscientes (do escopo)**

- Uma sala e horários fixos de 30 min (enunciado). Várias salas: `room_id` no índice único; duração variável: _exclusion constraint_ com `tstzrange` (ADR-003).
- Mesmo horário de funcionamento todos os dias, inclusive fim de semana; sem feriados.
- `chk_slot_aligned` alinha em UTC — correto para Brasília (offset em horas inteiras), não para fusos de meia hora.
- Pacientes e tipos de exame vêm do seed (não há telas de cadastro); não é possível excluir rascunho (INTERPRETACOES.md #5 e #8).
- Listagem da clínica sem paginação: até 100 agendamentos por consulta (com filtro por dia isso basta).
- Sessão JWT não é revogável antes de expirar (8 h); o perfil é conferido no banco a cada requisição.
- Rate limit do login em memória (vale para uma instância da API).

**Pendências (cortadas pelo prazo, na ordem do plano)**

- Swagger/OpenAPI em `/docs` e `/health/ready` (com checagem do banco).
- Checagem explícita de `Origin` contra CSRF: hoje a proteção é `SameSite=Lax` + mutações só em JSON (formulário de outro site não envia `application/json` sem passar pelo CORS).
- CSP no nginx do front (o helmet cobre só a API).
- Testes de componente do front (as telas são cobertas pelo E2E; unitário só das mensagens).
- Teste de mutação (Stryker) no domínio.
- 3 alertas moderados do `pnpm audit`, todos em ferramentas de desenvolvimento (ver `docs/SEGURANCA.md`).

Pendências para produção (revogação de sessão, MFA, auditoria de leitura, backups, retenção/LGPD): `docs/SEGURANCA.md`.

## Tempo dedicado

Ver [`docs/TEMPO.md`](docs/TEMPO.md).

## Créditos

Foto da tela de login: banco de imagens [Pexels](https://www.pexels.com) ([licença Pexels](https://www.pexels.com/license/): uso livre, sem atribuição obrigatória), fornecida pelo autor e recortada (fundo removido) para compor o painel. Ícones: [Lucide](https://lucide.dev). Fonte: [Geist](https://vercel.com/font).

## Uso de IA

Vibe coding é requisito do desafio. Processo, prompts e correções em [`docs/PROCESSO_IA.md`](docs/PROCESSO_IA.md).
