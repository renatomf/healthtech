# ADR-001 — Monólito modular

**Status:** aceito

## Contexto

3 dias, uma pessoa, dois perfis e três áreas de negócio (identidade, agendamento, laudos).

## Decisão

Uma API com módulos `identity`, `scheduling` e `reports`, cada um em `domain`, `application`, `infra`, `http`. Fronteiras verificadas por `dependency-cruiser`.

## Alternativas

- **Microsserviços:** distribuição sem necessidade; perde a transação local entre agendamento e laudo.
- **Clean Architecture completa** (interfaces para tudo): cerimônia sem retorno neste escopo.

## Consequências

Uma transação local cobre agendamento e laudo. Fronteiras permitem extrair módulos no futuro.
