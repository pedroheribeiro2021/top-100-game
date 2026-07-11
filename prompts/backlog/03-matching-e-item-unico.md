# Prompt 03 — Matching normalizado + regra do item único

## Objetivo
Palpites são conferidos com normalização + aliases, e um item só pontua **uma vez por partida** (DOMAIN §4).

## Contexto
Leia: `docs/DOMAIN.md` §4, `docs/db/SCHEMA.md` (aliases e `usedItems`). Hoje o matching é `value.toLowerCase() === answer.toLowerCase()` em `submitAnswer`.

## Arquivos a analisar
- `functions/src/services/games.service.ts` — `submitAnswer` (matching + item único)
- `functions/src/services/` — criar `matching.ts` (função pura `normalize(text)` e `findRankingItem(ranking, answer)`)
- `web/types/game.ts` — campo `usedItems` e flag "já usado" na resposta
- `web/components/RoundResultView.tsx` — exibir "item já usado" na revelação (texto simples)

## Arquivos que NÃO precisa analisar
- Controllers/rotas (assinatura não muda), `web/app/page.tsx`, temas JSON.

## Regras do jogo
- `normalize`: minúsculas → remover acentos (NFD) → trim → colapsar espaços → remover pontuação nas bordas.
- Acerto = normalize(palpite) ∈ {normalize(value)} ∪ {normalize(aliases)}.
- Item já em `usedItems` → 0 pontos, resposta marcada `alreadyUsed: true`; senão pontua e entra em `usedItems` (valor normalizado do `value`).
- Dois jogadores palpitam o mesmo item na MESMA rodada: pontua quem enviou primeiro; o segundo recebe `alreadyUsed`.

## Critérios de aceite
- [ ] "sao paulo", "São Paulo " e alias "SP" acertam o mesmo item
- [ ] Item repetido em rodada posterior = 0 pontos com `alreadyUsed`
- [ ] Mesmo item na mesma rodada: só o primeiro pontua
- [ ] `matching.ts` é puro (sem I/O) — testável
- [ ] Build + lint limpos

## Restrições
- Não mudar fórmula de pontos (pontos = posição). Não tocar no fluxo de fases.

## Checklist final
- [ ] `docs/db/SCHEMA.md`: `usedItems` marcado como implementado
- [ ] Commit `feat(game): normalized matching with aliases and single-use items`
