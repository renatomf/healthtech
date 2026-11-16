# ADR-006 — JWT em cookie httpOnly

**Status:** aceito

## Contexto

O enunciado pede "mecanismo simples de autenticação".

## Decisão

JWT HS256 (8 h) em cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção. Senha com `bcryptjs`. Rate limit no login. `role` conferido no banco a cada requisição.

## Alternativas

- **Token em `localStorage`:** exposto a XSS.
- **Sessão em tabela:** revogável, mas acrescenta tabela e limpeza.
- **OAuth/OIDC:** fora do escopo.

## Consequências

Sem revogação antes da expiração (pendência documentada). Conferir `role` no banco reduz o risco de usuário rebaixado.
