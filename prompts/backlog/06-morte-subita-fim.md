# Prompt 06 — Morte súbita e tela final completa

## Objetivo
Empate na liderança gera morte súbita entre os empatados; tela final mostra ranking dos jogadores, vencedor, Top 100 completo e "jogar novamente" (DOMAIN §6).

## Contexto
Leia: `docs/DOMAIN.md` §6, `docs/DESIGN.md` telas 7/8A/8B. Hoje o fim pega `sortedPlayers[0]` sem checar empate; tela final é simples. Pré-requisito: prompts 01 (ranking já sai quando FINISHED) e 04 (config da sala) aplicados.

## Arquivos a analisar
- `functions/src/services/games.service.ts` — no fechamento da última rodada: detectar empate na maior pontuação → status `SUDDEN_DEATH` (nova rodada só para empatados) em vez de FINISHED; repetir até desempatar
- `web/types/game.ts` — status/fases novos, `tiedPlayerIds`
- `web/app/game/[code]/page.tsx` — bloquear input de quem não está na morte súbita; banner "MORTE SÚBITA"
- `web/components/RoundResultView.tsx` — tela final: pódio, vencedor, lista do Top 100 (agora disponível), botões jogar novamente/nova sala

## Arquivos que NÃO precisa analisar
- Temas, matching (reutilizar como está), `web/app/page.tsx`.

## Regras do jogo
- Morte súbita: mesma mecânica de rodada (palpite → pontos), apenas jogadores empatados; demais assistem.
- Continua empatado → nova morte súbita. Desempatou → FINISHED com `winner`.
- "Jogar novamente": novo jogo na MESMA sala (novo tema sorteado ou escolhido pelo host), zera pontuações e `usedItems` — pode ser rota `POST /:id/rematch` que cria novo documento e devolve o novo id.
- Estados: atualizar DOMAIN §8 (`SUDDEN_DEATH` entre STARTED e FINISHED) — incluir a edição no diff.

## Critérios de aceite
- [ ] Dois líderes empatados caem em morte súbita; só eles respondem
- [ ] Desempate encerra com vencedor correto
- [ ] Tela final mostra Top 100 completo e permite rematch funcional
- [ ] Build + lint limpos

## Restrições
- Reutilizar fechamento de rodada (não duplicar lógica de pontuação).

## Checklist final
- [ ] `docs/DOMAIN.md` §8 e `docs/db/SCHEMA.md` atualizados no mesmo PR
- [ ] Commit `feat(game): sudden death tiebreak and full end-game screen`
