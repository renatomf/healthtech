# Segurança

Toda decisão de acesso é tomada no backend e nega por padrão. Dados de um paciente só são lidos por queries que já filtram pelo paciente do token, e as respostas só serializam os campos declarados para o perfil. Referência: OWASP API Security Top 10 (2023).

## Autenticação

| Item              | Decisão                                                                     | Motivo                                              |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| Senha             | `bcryptjs`, custo 12                                                        | Sem dependência nativa; instala em qualquer máquina |
| Login inexistente | Compara com hash fictício antes de responder                                | Tempo de resposta não revela se o e-mail existe     |
| Mensagem de erro  | Sempre "credenciais inválidas"                                              | Evita enumeração                                    |
| Rate limit        | 5/min por IP + e-mail (`@fastify/rate-limit`)                               | Freia força bruta                                   |
| Token             | JWT HS256, `sub` + `role`, 8 h; segredo ≥ 32 bytes validado por Zod no boot | Simples, como pede o enunciado                      |
| Transporte        | Cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção, `Path=/`           | JS não lê o token                                   |
| Logout            | Limpa o cookie                                                              | **Limitação:** JWT não é revogável antes de expirar |
| `role`            | Conferido no banco a cada requisição                                        | Usuário removido/rebaixado perde acesso na hora     |

## Autorização

1. **Nega por padrão.** `/clinic/*` e `/patient/*` são plugins com hook `onRequest` exigindo o perfil. Rota nova herda.
2. **Escopo na query.** Rotas de paciente nunca recebem `patientId` do cliente. Ex.: `WHERE a.id = $1 AND a.patient_id = $me AND r.status = 'PUBLISHED'`.
3. **404 em vez de 403** para recurso de outro paciente e para rascunho. 403 só para perfil errado.
4. **DTO por perfil.** O serializador do Fastify descarta campos não declarados.
5. **UUID v4** como ID. Sem enumeração.
6. **Teste que varre as rotas.** Hook `onRoute` coleta todas as rotas; teste garante 403/401 em cada uma conforme o grupo.

## Ameaças e mitigações

| Ameaça (OWASP API 2023)                         | Aqui                                                      | Mitigação                                                                     |
| ----------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| API1 Broken Object Level Authorization          | Paciente troca o ID na URL                                | Escopo na query + 404 + cenário obrigatório 2                                 |
| API2 Broken Authentication                      | Força bruta, token roubado                                | Rate limit, bcrypt, cookie httpOnly, expiração 8 h                            |
| API3 Broken Object Property Level Authorization | Rascunho vaza em campo extra; mass assignment de `status` | DTO por perfil; Zod `.strict()`; `status`/`published_at` nunca vêm do cliente |
| API4 Unrestricted Resource Consumption          | Laudo gigante, listagem sem limite                        | `body` ≤ 20.000 caracteres, `bodyLimit` 100 KB, `limit` ≤ 100                 |
| API5 Broken Function Level Authorization        | Paciente chama rota da clínica                            | Hook por grupo + varredura de rotas                                           |
| API8 Security Misconfiguration                  | Stack trace exposto, CORS aberto                          | 500 genérico; `@fastify/helmet`; CORS só `WEB_ORIGIN` com `credentials`       |
| SQL injection                                   | Filtro por nome                                           | Drizzle parametriza; `sql.raw` com entrada proibido                           |
| XSS                                             | `<script>` no laudo                                       | React escapa; laudo como texto; sem `dangerouslySetInnerHTML`; CSP            |
| CSRF                                            | POST cross-site com cookie                                | `SameSite=Lax`; mutações só `application/json`; checagem de `Origin`          |

## Segurança verificável pelo avaliador

- **Coleção `docs/api/api.http`**: login como paciente B → laudo do paciente A (404) → rota da clínica (403) → sem cookie (401).
- **`traceId`** em toda resposta de erro = request-id do log (`x-request-id`).

## Dados sensíveis (LGPD)

Laudo médico é dado pessoal sensível (LGPD, art. 5º, II).

- Logs sem dados pessoais: `redact` do Pino em `req.headers.cookie`, `req.headers.authorization`, `body.password`, `body.body`, `body.email`.
- Minimização: listagem do paciente traz só `hasPublishedReport`, não o texto.
- Auditoria mínima: `created_by`, `canceled_by`, `published_by` com data.
- Seed fictício: domínio `@demo.local`, sem CPF.
- Segredos: só `.env.example` no repo; `.env` no `.gitignore`; `gitleaks` no CI sobre todo o histórico. Os 5 achados atuais são valores fictícios de propósito (texto "troque-por-…" do `.env.example`, segredo e JWT falso dos testes), ignorados em `.gitleaksignore` pela impressão digital exata — um segredo novo com o mesmo texto em outro lugar continua sendo pego.

## Pendências para produção

Revogação de sessão / refresh token rotativo; MFA para a equipe; auditoria de **leitura** de laudos; criptografia em repouso e backups; política de retenção e base legal; HTTPS obrigatório com HSTS; varredura contínua de dependências. O CI roda `pnpm audit --audit-level high`; hoje há 3 alertas moderados, todos em ferramentas de desenvolvimento que não vão para a imagem de produção (`esbuild` via `drizzle-kit`; `glob`/`minimatch` via `testcontainers`).
