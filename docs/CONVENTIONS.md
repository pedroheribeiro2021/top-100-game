# CONVENTIONS — padrões e convenções

Regras concretas para código consistente e barato de revisar. Espelham o que já existe no projeto.

## Linguagem e stack
- **TypeScript** nos dois apps. Evitar `any` novo; o legado (`games.service.ts`) será tipado aos poucos — não piorar.
- **Next.js 16 App Router** em `web/`. ⚠️ Breaking changes — consulte `web/node_modules/next/dist/docs/`.
- **React 19**; componentes client com `"use client"` no topo.
- **Tailwind 4**; sem CSS solto além de `web/app/globals.css`. Tokens do design em `docs/DESIGN.md`.
- API: **Express** em `functions/src`, Node 24.

## Estrutura
- Regra de negócio → `functions/src/services/`. Controllers só validam entrada e traduzem erro em HTTP.
- Front **não** fala com Firestore direto para estado de jogo; passa pela API (`web/services/api.ts`).
- Tipos do jogo em `web/types/game.ts` espelham o documento `games` — mudou o service, atualize os tipos e `docs/db/SCHEMA.md`.
- Temas: só em `data/themes/*.json`, no schema de `docs/db/SCHEMA.md`. Nunca hardcoded em código.

## Naming
- Serviços: verbo + entidade (`createGame`, `submitAnswer`, `advanceRound`).
- Erros de domínio: string constante em SCREAMING_SNAKE (`GAME_NOT_FOUND`, `ALREADY_ANSWERED`) lançada no service, traduzida no controller.
- Tipos `PascalCase`; arquivos de service `kebab/camelCase.ts` por domínio (`games.service.ts`).
- IDs de tema: slug kebab-case (`cidades-mais-populosas-mundo`).
- Texto de UI e mensagens de erro ao jogador: **português**.

## Commits e branches
- Conventional Commits: `feat(game): …`, `fix(api): …`, `docs(domain): …`, `chore: …`.
- Branch por tarefa: `feature/<slug>`, `fix/<slug>`. PRs para `develop`; `main` recebe de `develop`.
- CI (`ci.yml`) precisa passar: lint + build de `web` e `functions`.

## Segurança
- Nunca commitar credencial (ver pendência `service-account.json` no backlog 08). Env via `.env` local + exemplo em `.env.example`.
- Nada de segredo no front (`NEXT_PUBLIC_*` é público por definição).
- Ranking não sai do servidor durante a partida (ADR-0002).
