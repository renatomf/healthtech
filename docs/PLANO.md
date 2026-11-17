# Plano de 3 dias e checklist

Backend e os 5 testes obrigatórios prontos no dia 2. Dia 3: paciente, acabamento e documentação.
Se faltar tempo, corte nesta ordem: Stryker → Playwright → Swagger → CI. Nunca corte os testes obrigatórios nem o README.

## Dia 1 — base e agendamento

- [x] Monorepo pnpm (`apps/api`, `apps/web`, `packages/shared`), TS strict, Biome, `dependency-cruiser`, `packageManager` via Corepack — `e2e/` é criado junto com os testes Playwright (Dia 3), para não deixar pasta vazia
- [x] Docker Compose (postgres, api, web) + `.env` validado por Zod no boot
- [x] Schema Drizzle + migration com constraints e trigger (ver `ARQUITETURA.md`) — Testcontainers adiantado, com testes das constraints
- [x] Seed relativo à data atual (ver "Seed" abaixo)
- [x] Testcontainers + `FixedClock`; **cenários 1 e 5 escritos, falhando** (commit vermelho)
- [x] Auth: login, logout, me, `requireRole`, rate limit, helmet, CORS
- [x] Agendamentos: criar, listar com filtros (data no fuso, paciente), cancelar, `/slots`; cenários 1 e 5 passando

## Dia 2 — laudos, autorização e telas da clínica

- [x] **Cenários 2, 3 e 4 escritos, falhando**
- [x] Laudos: salvar rascunho, publicar (`FOR UPDATE` + UPDATE condicional)
- [x] Rotas do paciente com escopo na query e DTO próprio; cenários 2, 3 e 4 passando
- [x] Extras: corrida cancelar × publicar, varredura de autorização, filtro 22:30, constraints via SQL
- [x] Front clínica: login, lista com filtros, novo agendamento (combobox + slots), detalhe com editor de laudo, cancelar

## Dia 3 — paciente, acabamento e documentação

- [x] Front paciente (mobile-first): lista com situação e selo, leitura do laudo
- [x] Loading/vazio/erro; diálogos de confirmação (publicar, cancelar); mensagens por `code`; 401 → login
- [x] Playwright: 3 fluxos + axe
- [x] CI: biome, typecheck, depcruise, testes com `TZ=UTC` e `TZ=Asia/Tokyo`, `pnpm audit`, gitleaks
- [x] Extras (~1h30): `demo:race`, `docs/api/api.http`, `traceId` nos erros, `dependency-cruiser`, diagrama ER (mermaid em `ARQUITETURA.md`) — tag `v1.0.0` no fim, depois do push
- [ ] README completo, `PROCESSO_IA.md`, `TEMPO.md` preenchidos

## Antes de enviar

- [x] Clonar em diretório limpo e seguir só o README até os testes passarem — 16/11: clone sem `.env` → `docker compose up -d` (build do zero, seed automático, login das duas contas) → `pnpm install` → `pnpm verify` (66) → `pnpm test:e2e` (13)
- [ ] `git log` sem `.env`, segredos ou arquivos gerados
- [ ] Nenhum `TODO`, `console.log`, `.skip` ou código comentado
- [ ] Roteiro de avaliação executado manualmente
- [ ] Ensaio: índice parcial vs checagem na app; cancelar × publicar; 404 vs 403; várias salas; onde a IA errou

## Seed (datas relativas a `now()` no fuso da clínica)

| Conta                | Senha       | Perfil  |
| -------------------- | ----------- | ------- |
| `clinica@demo.local` | `Demo@1234` | CLINIC  |
| `joao@demo.local`    | `Demo@1234` | PATIENT |
| `maria@demo.local`   | `Demo@1234` | PATIENT |

| Agendamento | Paciente | Quando                 | Estado                                |
| ----------- | -------- | ---------------------- | ------------------------------------- |
| A           | João     | ontem 10:00            | SCHEDULED + laudo PUBLISHED           |
| B           | João     | ontem 14:00            | SCHEDULED + laudo DRAFT               |
| C           | Maria    | ontem 11:00            | SCHEDULED + laudo PUBLISHED           |
| D           | Maria    | amanhã 09:00           | CANCELED (slot livre para reutilizar) |
| E           | João     | amanhã 10:00           | SCHEDULED (slot ocupado)              |
| F           | Maria    | depois de amanhã 15:30 | SCHEDULED                             |

Seed inserido direto no banco (ignora a regra de "passado" do domínio, que só vale para a API).
