# Estratégia de testes

Unitários provam regras de domínio; integração com Postgres real prova concorrência e autorização; E2E prova os fluxos do usuário. Os 5 cenários do enunciado são testes de integração.

## Camadas

| Camada             | Ferramenta                               | O que prova                                                                                                                        | Qtde aprox. |
| ------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Unitário (domínio) | Vitest                                   | `isValidSlot`, `isInPast`, `assertCanCancel`, `assertCanReceiveReport`, `assertCanEditReport`, `clinicDayRange`, `listClinicSlots` | 30–40       |
| Unitário (front)   | Vitest + Testing Library + MSW           | Mensagem de 409, badge de rascunho, formatação de data                                                                             | 10–15       |
| Integração         | Vitest + `app.inject()` + Testcontainers | 5 cenários obrigatórios, corridas, autorização rota a rota, constraints                                                            | 25–35       |
| E2E                | Playwright + axe                         | 3 fluxos + acessibilidade                                                                                                          | 3 + axe     |

## Configuração

- `vitest.config.ts` na raiz com `test.projects` `unit`, `integration`, `web` (`vitest.workspace.ts` está obsoleto no Vitest atual).
- Testcontainers: `globalSetup` sobe Postgres uma vez, roda as **migrations reais**, exporta `DATABASE_URL`. Entre testes: `TRUNCATE … RESTART IDENTITY CASCADE`. Sem transação-rollback por teste (impediria o teste de concorrência).
- Relógio: `FixedClock` injetado. Sem `vi.useFakeTimers()` no backend.
- Pool de conexões nos testes ≥ 10 (concorrência real).
- CI roda a suíte com `TZ=UTC` **e** `TZ=Asia/Tokyo`.
- Cobertura: `@vitest/coverage-v8`, mínimo 90% de linhas em `modules/*/domain`; sem meta global.
- Opcional: Stryker (mutação) só no domínio.

## Cenários obrigatórios

| #   | `describe`                                                        | Como                                    | Verifica                                                                                  |
| --- | ----------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `Cenário 1 — duas tentativas simultâneas no mesmo horário`        | 10 POST idênticos em `Promise.all`      | 1×201, 9×409 `SLOT_UNAVAILABLE`; 1 linha `SCHEDULED` no banco                             |
| 2   | `Cenário 2 — paciente tenta ler laudo de outro paciente`          | Laudo publicado de A, cookie de B       | 404; corpo sem `title`/`body`                                                             |
| 3   | `Cenário 3 — paciente tenta acessar rascunho`                     | Próprio paciente, laudo `DRAFT`         | 404 no laudo; listagem `hasPublishedReport: false`; texto do rascunho em nenhuma resposta |
| 4   | `Cenário 4 — laudo publicado fica disponível ao paciente correto` | Clínica salva e publica; A e B leem     | A: 200 com conteúdo e `publishedAt`; B: 404                                               |
| 5   | `Cenário 5 — agendar no passado é rejeitado`                      | `FixedClock` 10:10; slots 10:00 e ontem | 422 `SLOT_IN_PAST`; nenhuma linha criada                                                  |

## Além do enunciado

- Corrida cancelar × publicar (20 rodadas): estado final sempre válido.
- Reutilizar slot cancelado, inclusive com 2 reservas simultâneas no slot liberado.
- Constraints diretas via SQL: slot 10:15 e update de laudo publicado falham no banco.
- Filtro por data no fuso: agendamento 22:30 (Brasília) aparece no dia certo.
- Varredura de autorização: toda rota `/clinic` → 403 para paciente, 401 sem token; toda `/patient` → 403 para clínica.
- Validação: campos extras, slot desalinhado, fora do horário, laudo acima do limite → 400/422.

## Guardas automáticas no CI

- `dependency-cruiser`: `domain` não importa `infra`, `fastify`, `drizzle-orm`; módulo não importa `infra` de outro.
- `@axe-core/playwright` em cada tela principal; falha em `serious`/`critical`.

## Playwright

1. Clínica agenda: login → paciente → tipo → slot livre → aparece na lista filtrada.
2. Laudo do rascunho ao paciente: cria rascunho → publica (confirma) → paciente vê selo e lê.
3. Regras visíveis: cancelar com laudo publicado bloqueado; slot ocupado desabilitado.

Seletores por papel/rótulo; `pnpm db:reset` antes; `trace: 'on-first-retry'`; relatório HTML como artefato no CI.

## Padrões

- Nomes descrevem a regra em português.
- AAA, um comportamento por teste, sem dependência de ordem.
- Factories (`makePatient()`, `makeAppointment({ status: 'CANCELED' })`).
- Verificar efeito (banco, ausência de dados no corpo), não só status.
- Sem `sleep`, `retry`, `.skip`, `.only`.
- Mocks só na fronteira (MSW, `FixedClock`). Nunca mock de repositório/banco.
- Vermelho antes do verde: testes obrigatórios commitados falhando antes da implementação.
