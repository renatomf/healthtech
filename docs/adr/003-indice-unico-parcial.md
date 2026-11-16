# ADR-003 — Unicidade de slot por índice único parcial

**Status:** aceito

## Contexto

Uma sala, slots fixos de 30 min, horário de cancelado reutilizável, e "apenas uma de duas tentativas simultâneas deve ser aceita".

## Decisão

`CREATE UNIQUE INDEX uq_active_slot ON appointments (scheduled_at) WHERE status = 'SCHEDULED'` + `CHECK` de alinhamento a :00/:30. O erro `23505` vira 409 `SLOT_UNAVAILABLE`. A pré-verificação no serviço só melhora a mensagem.

## Alternativas

- **Verificação na aplicação:** falha sob concorrência.
- **SERIALIZABLE:** exige retry em toda transação.
- **Lock distribuído (Redis):** infraestrutura extra para algo que o banco resolve.
- **Exclusion constraint com `tstzrange`:** correta para duração variável; excessiva para slots fixos.

## Consequências

Várias salas → `room_id` no índice. Duração variável → exclusion constraint (`btree_gist`).
