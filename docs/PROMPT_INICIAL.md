# Prompt inicial para o Claude Code

Cole no painel do Claude Code (VS Code) ao abrir o projeto. Use o modo de planejamento primeiro.

---

Leia `CLAUDE.md`, `AGENTS.md` e todos os arquivos em `docs/` (incluindo `docs/adr/`). Eles contêm o enunciado oficial, as interpretações, a arquitetura, a segurança, a estratégia de testes e o plano.

Depois:

1. Resuma em até 10 linhas o que vai ser construído e as 5 regras mais críticas.
2. Liste qualquer contradição ou lacuna que encontrar entre os documentos.
3. Proponha o plano de execução da **seção "Dia 1"** de `docs/PLANO.md`, tarefa por tarefa, com os arquivos que cada uma cria.

Não escreva código ainda. Espere minha aprovação.

---

## Prompts seguintes (sugestão)

- "Execute a tarefa 1 do Dia 1. Ao terminar, rode `pnpm verify` e mostre o resultado."
- "Escreva os testes dos cenários 1 e 5 conforme `docs/TESTES.md`. Eles devem falhar. Não implemente nada ainda."
- "Implemente o mínimo para os cenários 1 e 5 passarem, respeitando `AGENTS.md`."
- "Revise o que você fez contra `AGENTS.md` e `docs/SEGURANCA.md` e liste violações."
