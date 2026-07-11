# ARCHITECTURE — mapa do projeto

Monorepo com dois apps: `functions/` (API Express hospedada como Firebase Function; também roda no Render) e `web/` (Next.js 16 App Router). Estado da partida vive no Firestore; o front faz polling de 2s.

```
top-100-game/
├─ functions/            # API (Express + Firestore)
│  └─ src/
│     ├─ index.ts                    # bootstrap: env, emulador local, Express, rotas
│     ├─ config/firestore.ts         # client Firestore (admin)
│     ├─ routes/games.routes.ts      # mapeamento das rotas /games
│     ├─ controllers/games.controller.ts  # HTTP: validação de entrada, códigos de erro
│     ├─ services/games.service.ts   # REGRAS DA PARTIDA: criar, entrar, iniciar, responder, avançar
│     ├─ services/ranking.service.ts # geração de ranking (Groq→OpenRouter→fallback) — vira fallback do banco de temas (ADR-0001)
│     ├─ services/generateRanking.ts # ⚠️ mock morto, não importado — remover (backlog 08)
│     └─ utils/generateGameCode.ts   # código de sala (6 chars)
├─ web/                  # Front (Next.js 16 + Tailwind 4)
│  └─ app/page.tsx                   # Home: criar sala
│  └─ app/game/[code]/page.tsx       # Sala: lobby + jogo + resultados (polling 2s)
│  └─ components/RoundResultView.tsx # revelação da rodada
│  └─ hooks/useCurrentPlayer.ts      # identifica jogador via localStorage
│  └─ services/api.ts                # client HTTP da API
│  └─ types/game.ts                  # tipos espelhando o documento `games`
├─ data/themes/          # BANCO DE TEMAS pré-gerados (JSON, ADR-0001)
├─ docs/ · prompts/ · checklists/ · templates/   # metodologia (ver docs/README.md)
```

## API (rotas atuais)
| Método | Rota | Faz |
|---|---|---|
| POST | `/games` | cria jogo a partir de um tema (gera ranking) |
| GET | `/games/:id` | estado do jogo ⚠️ hoje vaza o ranking — corrigir (backlog 01) |
| POST | `/games/join` | entra na sala por `gameCode` |
| POST | `/games/:id/start` | inicia (status RANKING_READY → STARTED) |
| POST | `/games/:id/answer` | registra palpite, pontua, avança rodada quando todos responderam |
| POST | `/games/:id/advance` | avança rodada manualmente (fallback de timeout) |

## Onde mexer (por tipo de tarefa)
| Tarefa | Arquivos |
|---|---|
| Regra da partida (pontuação, rodadas, empate) | `functions/src/services/games.service.ts` (+ `docs/DOMAIN.md`) |
| Origem/matching do ranking e temas | `functions/src/services/ranking.service.ts`, `data/themes/` |
| Nova rota / código de erro HTTP | `functions/src/routes/games.routes.ts`, `controllers/games.controller.ts` |
| O que a API expõe ao cliente | `controllers/games.controller.ts` (sanitização, ADR-0002) |
| Tela Home / criação de sala | `web/app/page.tsx`, `web/services/api.ts` |
| Tela da sala (lobby, jogo, revelação, fim) | `web/app/game/[code]/page.tsx`, `web/components/RoundResultView.tsx` |
| Visual/estilo | `docs/DESIGN.md` primeiro; depois `web/app/globals.css` e componentes |
| Tipos compartilhados do jogo | `web/types/game.ts` (espelhar mudanças do service) |

## Estado e infraestrutura
- **Firestore**: coleção única `games` (ver `db/SCHEMA.md`). Sem auth — jogador é identificado por `playerId` no localStorage.
- **Dev local**: `functions` roda com ts-node-dev + emulador Firestore (`localhost:8080`); web em `localhost:3000`.
- **CI**: `.github/workflows/ci.yml` (lint/build de web e functions).
- ⚠️ `functions/src/config/service-account.json` está no repositório — credencial commitada, tratar no backlog 08.
