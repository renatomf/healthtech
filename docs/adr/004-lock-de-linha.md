# ADR-004 — Lock de linha no agendamento para cancelar, salvar e publicar laudo

**Status:** aceito

## Contexto

"Cancelado não recebe laudo" e "publicado não pode ser cancelado" dependem de duas tabelas. Checagem simples tem corrida: cancelar e publicar ao mesmo tempo podem ambos passar.

## Decisão

Toda operação que muda o agendamento ou seu laudo começa com `SELECT … FROM appointments WHERE id = $1 FOR UPDATE` em transação. Publicação: `UPDATE … WHERE status = 'DRAFT' RETURNING *`. Trigger impede update de laudo publicado.

## Alternativas

- **Trigger cruzando tabelas:** regra escondida no banco, difícil de testar pela API.
- **Lock otimista (`version`):** retry no cliente para disputa rara.

## Consequências

Operações no mesmo agendamento são serializadas; impacto nulo para o volume de uma clínica. Teste dedicado à corrida cancelar × publicar.
