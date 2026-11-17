# Roteiro de teste manual

Passo a passo para conferir o sistema pela interface, do agendamento à leitura do laudo pelo paciente, incluindo as regras de negócio e a segurança. Cada passo diz **o que fazer** e **o que deve acontecer**. Tempo estimado: 20–25 minutos.

> Os dados de demonstração são **relativos a hoje** (horário de Brasília). "Ontem" e "amanhã" abaixo valem para o dia em que você rodar o seed.

## 0. Preparar

```bash
docker compose up -d
```

Os dados de demonstração já vêm carregados (passo a passo completo no README, em "Como rodar em 1 minuto").

Abra **http://localhost:5173**. Senha de todas as contas: `Demo@1234`.

| Conta                | Perfil            |
| -------------------- | ----------------- |
| `clinica@demo.local` | Equipe da clínica |
| `joao@demo.local`    | Paciente          |
| `maria@demo.local`   | Paciente          |

Dados carregados pelo seed:

|     | Paciente | Quando                 | Estado                          |
| --- | -------- | ---------------------- | ------------------------------- |
| A   | João     | ontem 10:00            | agendado, laudo **publicado**   |
| B   | João     | ontem 14:00            | agendado, laudo em **rascunho** |
| C   | Maria    | ontem 11:00            | agendado, laudo **publicado**   |
| D   | Maria    | amanhã 09:00           | **cancelado** (horário livre)   |
| E   | João     | amanhã 10:00           | agendado (horário ocupado)      |
| F   | Maria    | depois de amanhã 15:30 | agendado                        |

Para voltar ao estado inicial a qualquer momento: `docker compose exec api node src/db/seed.ts`.

---

## 1. Login e perfis

| #   | Faça                                             | Esperado                                                                                    |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1.1 | Entre com um e-mail certo e a senha errada       | "E-mail ou senha incorretos."                                                               |
| 1.2 | Erre a senha 6 vezes seguidas com o mesmo e-mail | Na 6ª: "Muitas tentativas. Aguarde um minuto e tente de novo."                              |
| 1.3 | Entre como `clinica@demo.local`                  | Vai para **Agenda**; na barra do topo aparecem o nome, o e-mail, o botão de tema e **Sair** |

## 2. Agenda

| #   | Faça                                                   | Esperado                                                                                                       |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 2.1 | No calendário à direita, clique em **ontem**           | Lista com A (10:00), C (11:00) e B (14:00); cards "Agendados 3", "Laudos em rascunho 1", "Laudos publicados 2" |
| 2.2 | Em **Paciente**, escolha _João da Silva_               | Só A e B; a URL ganha `paciente=…`                                                                             |
| 2.3 | Volte para _Todos os pacientes_ e clique em **amanhã** | D (09:00, riscado, "Cancelado") e E (10:00)                                                                    |

## 3. Criar um agendamento

| #   | Faça                                           | Esperado                                                                                     |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 3.1 | Clique em **Novo agendamento**                 | Tela com "01 Paciente" e "02 Exame e horário"                                                |
| 3.2 | Busque `mar` em **Buscar por nome ou e-mail**  | Só _Maria Oliveira_                                                                          |
| 3.3 | Escolha Maria, **Tipo de exame** = _Ultrassom_ | —                                                                                            |
| 3.4 | Em **Dia**, abra o calendário                  | Dias passados apagados e desabilitados; seta de mês anterior travada no mês atual            |
| 3.5 | Escolha **amanhã**                             | Grade de horários de 08:00 a 17:30; **10:00 riscado** (E); **09:00 livre** (D foi cancelado) |
| 3.6 | Escolha **08:30** e **Confirmar agendamento**  | Volta para a agenda de amanhã com _08:30 Maria Oliveira · Ultrassom · Agendado_              |
| 3.7 | Abra Novo agendamento, escolha **hoje**        | Horários que já começaram aparecem riscados (não se agenda no passado)                       |

## 4. Disputa pelo mesmo horário

| #   | Faça                                                                                                                                      | Esperado                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 4.1 | Abra **duas abas** em Novo agendamento. Nas duas, escolha um paciente, um exame, **amanhã** e o mesmo horário (ex.: 11:00), sem confirmar | —                                                                                                             |
| 4.2 | Confirme na aba 1                                                                                                                         | Agendado; volta para a agenda                                                                                 |
| 4.3 | Confirme na aba 2                                                                                                                         | "Esse horário acabou de ser ocupado. Escolha outro."; a grade recarrega com 11:00 riscado e a escolha é limpa |
| 4.4 | No terminal: `pnpm demo:race`                                                                                                             | 10 reservas simultâneas do mesmo horário: **1 aceita, 9 recusadas** (409 `SLOT_UNAVAILABLE`)                  |

## 5. Cancelar e reutilizar o horário

| #   | Faça                                                                                   | Esperado                                                                                      |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 5.1 | Na agenda de **amanhã**, abra **E** (João, 10:00) e clique em **Cancelar agendamento** | Diálogo de confirmação                                                                        |
| 5.2 | Confirme                                                                               | Selo **Cancelado**; o editor de laudo some ("Agendamento cancelado: não pode receber laudo.") |
| 5.3 | Novo agendamento → **amanhã**                                                          | **10:00 voltou a ficar livre**                                                                |
| 5.4 | Na agenda de amanhã, abra **D** (cancelado no seed)                                    | Mesmo aviso: cancelado não recebe laudo                                                       |

## 6. Laudo: do rascunho à publicação

| #   | Faça                                                 | Esperado                                                                                      |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 6.1 | Na agenda de **ontem**, abra **B** (João, Ultrassom) | Laudo com o selo "Rascunho · visível só para a clínica"                                       |
| 6.2 | Altere o **Texto do laudo**                          | **Publicar laudo** fica desabilitado (salve antes de publicar)                                |
| 6.3 | **Salvar rascunho**                                  | Continua rascunho; **Publicar laudo** volta a ficar disponível                                |
| 6.4 | **Publicar laudo** → **Publicar** no diálogo         | Selo "Publicado em dd/mm/aaaa às hh:mm"; os campos travam; os botões de salvar/publicar somem |
| 6.5 | Ainda em B, tente **Cancelar agendamento**           | Botão desabilitado: "Agendamentos com laudo publicado não podem ser cancelados."              |

## 7. Visão do paciente

| #   | Faça                                                 | Esperado                                                                                                              |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 7.1 | **Sair** e entre como `joao@demo.local`              | "Olá, João!", card **Próximo exame** (o mais próximo no futuro) e **Meus exames**                                     |
| 7.2 | Veja o Raio-X (A) e o Ultrassom (B)                  | Ambos com **Laudo disponível** (B por causa do passo 6); se pulou o passo 6, B aparece só como **Agendado**, sem link |
| 7.3 | Abra o laudo do Raio-X                               | Título, profissional, data de publicação e o texto, com as quebras de linha                                           |
| 7.4 | Copie a URL do laudo (`/paciente/exames/<id>/laudo`) | —                                                                                                                     |

## 8. Isolamento entre pacientes

| #   | Faça                                     | Esperado                                                                     |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| 8.1 | **Sair** e entre como `maria@demo.local` | Só os exames da Maria (C, D, F); nada do João                                |
| 8.2 | Cole a URL do laudo do João (passo 7.4)  | "Laudo não disponível." (a API responde 404, não 403: não revela que existe) |
| 8.3 | Acesse `http://localhost:5173/clinica`   | Volta para a área do paciente                                                |

## 9. API direto (segurança no backend)

Abra [`docs/api/api.http`](api/api.http) no VS Code com a extensão REST Client e rode as requisições em ordem, ou use `curl`.

| Chamada                                    | Esperado                                              |
| ------------------------------------------ | ----------------------------------------------------- |
| Maria lendo o laudo do João                | **404** `NOT_FOUND`                                   |
| Maria lendo o rascunho do João             | **404**                                               |
| Paciente chamando `/clinic/appointments`   | **403** `FORBIDDEN`                                   |
| Sem cookie                                 | **401** `UNAUTHENTICATED`                             |
| Login com campo extra (`"role": "CLINIC"`) | **400** `VALIDATION_ERROR`                            |
| Qualquer erro                              | Corpo com `traceId` igual ao cabeçalho `x-request-id` |

## 10. Fuso horário

| #    | Faça                                                          | Esperado                                              |
| ---- | ------------------------------------------------------------- | ----------------------------------------------------- |
| 10.1 | Mude o fuso do computador (ex.: Tóquio) e recarregue a página | Os horários continuam os mesmos (horário de Brasília) |

## 11. Tema e celular

| #    | Faça                                                                           | Esperado                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.1 | Abra o site com o sistema em modo escuro                                       | Abre no **tema claro** (padrão)                                                                                                                                |
| 11.2 | Clique no botão de tema                                                        | Tema escuro; a escolha fica salva ao recarregar                                                                                                                |
| 11.3 | Abra no celular (ou DevTools em 390 px) como clínica                           | Barra com a marca e o **botão de menu** (usuário, Agenda, Novo agendamento, tema, Sair); cards em largura total; **botão "+" flutuante** para novo agendamento |
| 11.4 | Abra o menu e aperte Esc                                                       | Menu fecha                                                                                                                                                     |
| 11.5 | No Novo agendamento, use **Tipo de exame** só pelo teclado (Tab, setas, Enter) | Abre, navega e escolhe sem mouse                                                                                                                               |

## 12. Testes automatizados

```bash
pnpm verify      # lint + tipos + arquitetura + 66 testes (unitários e integração com Postgres real)
pnpm test:e2e    # 13 testes no Chrome: fluxos, teclado, fuso e acessibilidade (axe) nos dois temas
```

O `test:e2e` exige o stack no ar e reseta o banco antes. Os 5 cenários do enunciado estão em `describe('Cenário N — …')` nos testes de integração.

## Ao terminar

`docker compose exec api node src/db/seed.ts` volta os dados ao estado inicial.
