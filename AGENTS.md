# AGENTS.md — regras para agentes de IA

Estas regras valem para qualquer agente (Claude Code, Copilot, Cursor etc.). Em conflito com um pedido, aponte o conflito antes de agir.

## Arquitetura

- Monólito modular. Módulos em `apps/api/src/modules/{identity,scheduling,reports}`.
- Cada módulo: `domain/` (regras puras) → `application/` (casos de uso, transação explícita) → `infra/` (Drizzle, mapeamento de erros do Postgres) → `http/` (rotas Fastify + Zod).
- `domain/` **não importa** `fastify`, `drizzle-orm`, `pg`/`postgres`, nem nada de `infra/`. Não chama `Date.now()` / `new Date()`: recebe `Clock` injetado.
- Um módulo não importa o `infra/` de outro módulo.
- Contratos (schemas Zod de request/response) e utilitários de data ficam em `packages/shared` e são usados por api e web.

## Regras de negócio inegociáveis

- Invariantes ficam no banco **e** no domínio: `uq_active_slot`, `chk_slot_aligned`, `uq_report_appointment`, `chk_published`, trigger de imutabilidade do laudo publicado (ver `docs/ARQUITETURA.md`).
- Cancelar agendamento, salvar laudo e publicar laudo começam com `SELECT ... FOR UPDATE` no agendamento, dentro de transação.
- Publicação usa `UPDATE ... WHERE status = 'DRAFT' RETURNING *`; zero linhas → 409.
- Nunca "verifica e depois insere" como única proteção.

## Segurança

- Rotas `/clinic/*` e `/patient/*` são grupos com hook `requireRole` (nega por padrão). Rota nova herda o hook.
- Em rotas de paciente, `patientId` vem **sempre do token**, nunca de params/body/query.
- Dados do paciente são filtrados **na query** (`WHERE a.patient_id = $me`), nunca depois de buscar.
- Recurso de outro paciente ou rascunho → **404**. Perfil errado → 403. Sem auth → 401.
- DTO de resposta por perfil; o DTO do paciente não tem campo para conteúdo de rascunho.
- Schemas Zod de entrada com `.strict()`. `status`, `published_at`, `created_by` etc. nunca vêm do cliente.
- Proibido: `sql.raw`/`sql` com interpolação de entrada do usuário, `dangerouslySetInnerHTML`, token em `localStorage`, logar senha/cookie/token/texto de laudo/e-mail.

## Datas e fuso

- Banco: `timestamptz` (UTC). API: ISO 8601 com offset.
- Exibição e cálculo de "dia": `CLINIC_TIMEZONE` (`America/Sao_Paulo`). Nunca o fuso do navegador/servidor.
- Use só `formatClinicDateTime`, `clinicDayRange`, `parseClinicSlot`, `listClinicSlots` de `packages/shared`. Proibido `toLocaleString` e `new Date()` sem fuso explícito em lógica.

## Código

- TypeScript `strict`, sem `any`, sem `@ts-ignore`, sem `console.log` (use o logger).
- Erros da API no formato Problem Details (RFC 9457) com `code` estável e `traceId`.
- Dependência nova só com justificativa no commit; prefira o que já está na stack.
- Nada de código morto, componentes shadcn não usados ou pastas vazias.

## Testes

- Toda regra de negócio nova vem com teste no mesmo commit.
- Testes de integração usam Postgres real (Testcontainers) e as migrations reais. Nunca mockar repositório ou banco.
- Nomes de teste descrevem a regra em português. Os 5 cenários do enunciado usam `describe('Cenário N — ...')`.
- Verifique o efeito (estado do banco, ausência de dados no corpo), não só o status HTTP.
- Sem `sleep`, `retry`, `.skip`, `.only` em código entregue.

## Antes de concluir qualquer tarefa

1. `pnpm verify` passa.
2. `docs/PLANO.md` atualizado (marque o item).
3. Se houve decisão nova ou mudança de decisão → ADR novo em `docs/adr/`.
