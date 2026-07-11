# ADR-0002 — Ranking nunca trafega ao cliente durante a partida

**Status:** aceito
**Data:** 2026-07-09
**Supersedes:** —

## Contexto
`GET /games/:id` devolve o documento inteiro do Firestore, incluindo `ranking` com os 100 itens — qualquer jogador vê as respostas no console do navegador. Num jogo de adivinhação isso quebra o produto.

## Decisão
A API responde uma **visão sanitizada** do jogo: nunca inclui `ranking` (nem campo derivado que o revele) enquanto `status ≠ FINISHED`. A conferência de palpite acontece só no servidor. O Top 100 completo é exposto apenas na resposta de jogo finalizado (tela final, DOMAIN §6). Toda rota nova passa pela mesma sanitização (função única no controller/service).

## Consequências
+ Trapaça via API fechada; regra centralizada num único ponto.
− O front não pode mais ler `game.ranking` para nada antes do fim; revelação da rodada usa dados de `roundHistory`/`currentRoundAnswers` (posição e pontos calculados no servidor).
− Cliente e tipos (`web/types/game.ts`) precisam refletir a visão sanitizada.
