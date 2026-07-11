# Prompt 05 — Timer com expiração automática da rodada

## Objetivo
Rodada fecha sozinha quando `roundDeadlineAt` passa: quem não respondeu marca 0 e o jogo segue (revelação → próxima rodada ou fim). DOMAIN §3.

## Contexto
Leia: `docs/DOMAIN.md` §3. Hoje `roundDeadlineAt` existe mas nada o aplica; `POST /:id/advance` é manual. Sem Cloud Scheduler (custo zero): expiração **lazy** — aplicada quando qualquer request chega (polling de 2s do front garante avaliação frequente).

## Arquivos a analisar
- `functions/src/services/games.service.ts` — função `applyRoundTimeoutIfNeeded(game)` chamada em `getGameById` e `submitAnswer`; reutilizar a lógica de fechamento de rodada existente em `advanceRound`
- `web/app/game/[code]/page.tsx` — contagem regressiva visual usando `roundDeadlineAt` do servidor (não relógio local isolado)

## Arquivos que NÃO precisa analisar
- Controllers (sem rota nova), temas, matching.

## Regras do jogo
- Deadline vencida + fase ANSWERING → fechar rodada: pontuar respostas existentes, ausentes = 0, ir para RESULT/próxima rodada/fim exatamente como no fluxo "todos responderam".
- `submitAnswer` após a deadline → tratar como rodada fechada (`ROUND_EXPIRED`), não aceitar o palpite.
- Idempotência: duas requests simultâneas não podem fechar a rodada duas vezes (usar transação do Firestore ou checagem de fase no update).

## Critérios de aceite
- [ ] Rodada com jogador ausente fecha sozinha após o tempo (observável via polling)
- [ ] Palpite após o tempo é recusado com erro amigável
- [ ] Sem dupla pontuação em requests concorrentes
- [ ] Build + lint limpos

## Restrições
- Nenhum serviço pago/scheduler novo. Reutilizar o fechamento de rodada existente (não duplicar).

## Checklist final
- [ ] `docs/DOMAIN.md` §3 conferido (sem regra nova fora do doc)
- [ ] Commit `feat(game): lazy round expiration based on server deadline`
