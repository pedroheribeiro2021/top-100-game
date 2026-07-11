# Prompt 04 — Configuração da sala, host e limite de jogadores

## Objetivo
Criar sala com rodadas (3/5/7/10) e tempo por rodada (15/30/45/60s); sala aceita 2–5 jogadores; só o host inicia (DOMAIN §2).

## Contexto
Leia: `docs/DOMAIN.md` §2, `docs/DESIGN.md` telas 3A e 4. Hoje: `MAX_ROUNDS = 5` e `ROUND_TIME_LIMIT_SECONDS = 180` são constantes; qualquer um inicia; sem limite de jogadores.

## Arquivos a analisar
- `functions/src/services/games.service.ts` — `createGame(theme, config)`, `joinGame` (limite 5, nome duplicado), `startGame` (mínimo 2, só host), usar `maxRounds`/`roundTimeLimit` do documento
- `functions/src/controllers/games.controller.ts` — validar payload (rodadas ∈ {3,5,7,10}, tempo ∈ {15,30,45,60})
- `web/app/page.tsx` + `web/services/api.ts` — UI de criação com as opções
- `web/app/game/[code]/page.tsx` — lobby: mostrar config, badge de host, botão iniciar só para host
- `web/types/game.ts` — `maxRounds`, `roundTimeLimit`, `isHost`/`hostId`

## Arquivos que NÃO precisa analisar
- `ranking.service.ts`, `matching.ts`, temas.

## Regras do jogo
- Host = criador. Na criação, o host já entra como jogador (nome pedido na criação) e recebe `hostId` no documento.
- `joinGame`: recusar 6º jogador (`GAME_FULL`) e partida iniciada (já existe).
- `startGame`: exigir `playerId === hostId` (`NOT_HOST`) e ≥ 2 jogadores.
- Defaults: 5 rodadas, 30s.

## Critérios de aceite
- [ ] Sala criada com 3 rodadas/15s termina na rodada 3 e usa deadline de 15s
- [ ] 6º jogador recebe erro amigável
- [ ] Não-host não vê/consegue iniciar
- [ ] Build + lint limpos nos dois apps

## Restrições
- Manter compatibilidade dos estados (§8). Diff mínimo no service.

## Checklist final
- [ ] `docs/db/SCHEMA.md` (campos novos) e `docs/ARCHITECTURE.md` (payloads) atualizados
- [ ] Commit `feat(game): room config, host role and player limits`
