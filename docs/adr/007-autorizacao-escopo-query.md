# ADR-007 — Autorização por escopo na query e 404

**Status:** aceito

## Contexto

Paciente não pode acessar dados de outro, inclusive chamando a API diretamente.

## Decisão

Grupos de rotas por perfil com hook que nega por padrão; `patient_id` do token sempre no `WHERE`; DTO por perfil; 404 para recurso inacessível; 403 só para perfil errado.

## Alternativas

- **Buscar e depois conferir o dono:** uma rota sem o `if` vaza dados.
- **403 para recurso de outro:** confirma que o recurso existe.
- **Biblioteca de políticas (CASL):** excessiva para dois perfis.

## Consequências

Acesso indevido e recurso inexistente parecem iguais ao cliente; o log (com `traceId`) registra a diferença.
