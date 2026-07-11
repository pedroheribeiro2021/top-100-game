@AGENTS.md

# CLAUDE.md — modelo operacional

Este arquivo é carregado automaticamente. Mantenha-o **curto**; detalhes vivem nos docs linkados.

## Papéis
- **Tech Lead (planejamento/IA de arquitetura):** entende a demanda, quebra em tarefas, escolhe os arquivos, escreve o prompt e revisa. Não implementa o que dá pra especificar.
- **Claude Code (execução):** implementa o código a partir de um prompt fechado. Abre só os arquivos indicados.

## Fonte de verdade
A **documentação** manda; o código a implementa. Divergência = sinalizar, nunca assumir que o código está certo.
Índice completo: `docs/README.md`. Comece sempre por `docs/ARCHITECTURE.md`.

## Regras de token (obrigatórias)
1. Leia o doc antes do código. Use a tabela "onde mexer" em `docs/ARCHITECTURE.md`.
2. Abra só os arquivos que a tarefa exige. Nunca varra o projeto.
3. Não reescreva arquivos inteiros — edite o trecho.
4. Reutilize componentes e docs existentes antes de criar novos.
5. Toda mudança permanente atualiza o doc correspondente (ver `checklists/definition-of-done.md`).

## Fluxo de uma demanda
`docs/WORKFLOW.md` descreve o ciclo. Resumo: demanda → tarefa (`templates/TASK.md`) → prompt (`prompts/templates/*`) → implementação → checklist DoD → doc/ADR atualizado.

## Antes de codar
- Regras do jogo: `docs/DOMAIN.md`
- Visual e fluxo de telas: `docs/DESIGN.md`
- Padrões/naming/commits: `docs/CONVENTIONS.md`
- Decisões: `docs/adr/` — em especial ADR-0001 (banco de temas JSON, custo zero de IA) e ADR-0002 (ranking nunca vai ao cliente)
- Dados (Firestore + temas): `docs/db/SCHEMA.md`
- ⚠️ Next.js 16 tem breaking changes — consulte `web/node_modules/next/dist/docs/` antes de código de framework.

## Comandos
Web: `cd web && npm run dev` · `npm run build` · `npm run lint`
API: `cd functions && npm run dev` (ts-node-dev) · `npm run build` · `npm run lint` · `npm run serve` (emulador Firebase)

## Git
Conventional Commits (`feat(escopo): …`, `fix(api): …`, `docs: …`) — ver `docs/CONVENTIONS.md`.
**`develop` é a branch principal de trabalho**: branch por tarefa (`feature/<slug>`, `fix/<slug>`) sai de `develop` e volta via PR; `main` só recebe de `develop`. Nunca commitar direto em `main`.
