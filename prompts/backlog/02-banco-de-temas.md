# Prompt 02 — Banco de temas JSON (custo zero de IA)

## Objetivo
Partidas passam a usar os temas de `data/themes/*.json` (ADR-0001): tema digitado é casado com o banco; botão/rota de tema aleatório sorteia do banco. IA em runtime desligada por padrão.

## Contexto
Leia: `docs/adr/0001-banco-de-temas-json.md`, `docs/db/SCHEMA.md` (schema do tema), `docs/DOMAIN.md` §5. O banco já existe em `data/themes/` com `index.json`.

## Arquivos a analisar
- `functions/src/services/games.service.ts` — `createGame` recebe tema; trocar origem do ranking
- `functions/src/services/ranking.service.ts` — vira fallback atrás de flag `ENABLE_AI_FALLBACK` (default false); **remover** `generateFallbackRanking` (itens fake)
- `functions/src/controllers/games.controller.ts` + `routes/games.routes.ts` — nova rota `GET /themes` (lista `{id,title,category}`) e suporte a criar jogo com `themeId` ou tema aleatório
- `data/themes/index.json` — manifesto (leitura)
- `web/app/page.tsx` + `web/services/api.ts` — criar sala escolhendo tema do banco (busca com sugestão) ou aleatório

## Arquivos que NÃO precisa analisar
- `web/app/game/[code]/page.tsx`, componentes de jogo, CI.

## Regras do jogo
- Matching de tema digitado: normalização (DOMAIN §4) sobre `title` + similaridade simples (containment/Levenshtein leve). Sem match: sugerir os N mais próximos + opção de sorteio (fonte: DOMAIN §5).
- Sem match e fallback de IA desligado → erro amigável, nunca ranking fake.
- Novo campo `themeId` e `rankingSource: 'bank'` no documento do jogo (SCHEMA.md já prevê).
- Empacotar os JSONs junto ao deploy das functions (garantir que `data/` é lido em runtime — copiar no build se preciso).

## Critérios de aceite
- [ ] Criar sala com tema existente no banco monta ranking dos 100 itens do JSON
- [ ] Tema aleatório funciona
- [ ] Tema inexistente: resposta com sugestões, sem chamada de IA (com flag off)
- [ ] Nenhuma chave de API é necessária para jogar
- [ ] Build + lint limpos em `functions/` e `web/`

## Restrições
- Não tocar em pontuação/rodadas. Carregamento dos temas com cache em memória (ler o arquivo 1x).

## Checklist final
- [ ] `docs/ARCHITECTURE.md` (rota nova + origem do ranking) e `docs/db/SCHEMA.md` conferidos
- [ ] Commit `feat(themes): serve rankings from local theme bank`
