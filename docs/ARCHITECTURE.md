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
│     ├─ services/themes.service.ts  # banco de temas: lista, busca por id/aleatório, matching por título (ADR-0001)
│     ├─ services/ranking.service.ts # geração de ranking via Groq/OpenRouter — fallback OPCIONAL atrás de `ENABLE_AI_FALLBACK` (default off)
│     ├─ services/generateRanking.ts # ⚠️ mock morto, não importado — remover (backlog 08)
│     ├─ utils/generateGameCode.ts   # código de sala (6 chars)
│     └─ utils/normalize.ts          # normalização de texto p/ matching (DOMAIN §4)
│  └─ scripts/copy-themes.js         # build copia data/themes/ p/ lib/data/themes (deploy só empacota functions/)
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
| GET | `/themes` | lista `{id, title, category}` do banco de temas (ADR-0001) |
| POST | `/games` | cria jogo a partir de `themeId`, `random: true` ou `theme` (texto casado com o banco; sem match, IA só com flag) |
| GET | `/games/:id` | estado do jogo (visão sanitizada; `ranking` só quando `status = FINISHED`, ADR-0002) |
| POST | `/games/join` | entra na sala por `gameCode` |
| POST | `/games/:id/start` | inicia (status RANKING_READY → STARTED) |
| POST | `/games/:id/answer` | registra palpite, pontua, avança rodada quando todos responderam |
| POST | `/games/:id/advance` | avança rodada manualmente (fallback de timeout) |

## Onde mexer (por tipo de tarefa)
| Tarefa | Arquivos |
|---|---|
| Regra da partida (pontuação, rodadas, empate) | `functions/src/services/games.service.ts` (+ `docs/DOMAIN.md`) |
| Origem/matching do ranking e temas | `functions/src/services/themes.service.ts`, `data/themes/` (banco, ADR-0001); `ranking.service.ts` só se `ENABLE_AI_FALLBACK=true` |
| Nova rota / código de erro HTTP | `functions/src/routes/games.routes.ts` + `controllers/games.controller.ts` (rotas `/games/*`); rotas soltas (ex.: `/themes`) são montadas direto em `index.ts` |
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
