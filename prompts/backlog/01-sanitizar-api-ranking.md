# Prompt 01 — Sanitizar API: ranking nunca vai ao cliente (fix crítico)

## Sintoma
`GET /games/:id` (e a resposta de `POST /games`) devolvem o documento inteiro do Firestore, incluindo `ranking` com os 100 itens. Qualquer jogador abre o DevTools e vê todas as respostas.

## Comportamento esperado
API responde visão sanitizada: **sem `ranking`** enquanto `status ≠ FINISHED`. Jogo finalizado inclui o ranking (tela final mostra o Top 100). Fonte: ADR-0002, DOMAIN §7.

## Arquivos a analisar
- `functions/src/controllers/games.controller.ts` — ponto único de resposta HTTP
- `functions/src/services/games.service.ts` — apenas as assinaturas de retorno (não mudar regra)
- `web/types/game.ts` — refletir a visão sanitizada (ranking opcional, só em FINISHED)
- `web/app/game/[code]/page.tsx` e `web/components/RoundResultView.tsx` — **somente** onde leem `game.ranking`, para migrar a fontes permitidas (`currentRoundAnswers`/`roundHistory`)

## Arquivos que NÃO precisa analisar
- `ranking.service.ts`, `web/app/page.tsx`, configs, CI. Não varrer o projeto.

## Plano de implementação
1. Criar `toPublicGame(game)` (função pura no controller ou service) que remove `ranking` quando `status !== 'FINISHED'`.
2. Aplicar em TODAS as respostas que devolvem o jogo (`createGameHandler`, `getGameHandler`).
3. Ajustar tipos do front e qualquer leitura de `game.ranking` pré-fim.

## Critérios de aceite
- [ ] `GET /games/:id` de jogo em RANKING_READY/STARTED não contém `ranking` (verificar no emulador)
- [ ] Jogo FINISHED contém `ranking` completo
- [ ] Fluxo de partida no front continua funcionando (palpite, revelação, fim)
- [ ] `npm run build` + `npm run lint` limpos em `functions/` e `web/`

## Restrições
- Não mudar regra de pontuação nem estados. Fix cirúrgica.

## Checklist final
- [ ] `docs/ARCHITECTURE.md`: remover o ⚠️ da rota GET
- [ ] Commit `fix(api): hide ranking from responses until game is finished`
