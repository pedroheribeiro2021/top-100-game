# SCHEMA — dados do projeto

Duas fontes: Firestore (estado de partida) e `data/themes/` (banco de temas, ADR-0001).

## Firestore — coleção `games`
Documento por partida (id = UUID). Campos atuais:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | UUID do documento |
| `gameCode` | string | 6 chars, usado para entrar na sala |
| `theme` | string | título do tema |
| `themeId` | string \| null | slug do tema no banco; `null` quando o ranking veio do fallback de IA (flag `ENABLE_AI_FALLBACK`) |
| `status` | `RANKING_READY` \| `STARTED` \| `FINISHED` | estados em DOMAIN §8 |
| `roundPhase` | `ANSWERING` \| `RESULT` \| null | fase da rodada |
| `hostId` | string | id do jogador criador; só ele pode iniciar (`startGame`) |
| `players` | `{id, name, score}[]` | 1–5 (host entra na criação); nome duplicado é recusado (`NAME_TAKEN`), 6º jogador recebe `GAME_FULL` |
| `ranking` | `{position, value, aliases?}[]` | **secreto** — nunca sai na API antes de FINISHED (ADR-0002) |
| `currentRound` / `maxRounds` | number | `maxRounds` ∈ {3,5,7,10}, padrão 5 |
| `roundTimeLimit` | number (s) | ∈ {15,30,45,60}, padrão 30 |
| `currentRoundAnswers` | `{playerId, answer, points, alreadyUsed}[]` | limpo a cada rodada |
| `usedItems` | string[] | valores normalizados já pontuados; nunca sai na API antes de FINISHED (ADR-0002) |
| `roundHistory` | `{round, answers, ranking}[]` | `ranking` = placar dos jogadores |
| `roundDeadlineAt` | timestamp \| null | expiração da rodada |
| `winner` | Player \| null | definido em FINISHED |
| `rankingSource` | string | `bank` (padrão, ADR-0001) \| `groq` \| `openrouter` (fallback opcional, só com `ENABLE_AI_FALLBACK=true`) |
| `createdAt` / `updatedAt` | timestamp | |

Sem auth: o jogador guarda `playerId` no localStorage. Risco aceito para o escopo atual.

## Banco de temas — `data/themes/`
- `index.json`: manifesto `[{id, title, category, file}]` — o que o app lê para listar/sortear.
- `<id>.json`: um tema por arquivo:

```json
{
  "id": "cidades-mais-populosas-mundo",
  "title": "Top 100 cidades mais populosas do mundo",
  "category": "geografia",
  "accuracy": "aproximado",
  "updatedAt": "2026-07",
  "items": [
    { "position": 1, "value": "Tóquio", "aliases": ["Tokyo", "Toquio"] }
  ]
}
```

Regras do banco:
1. Exatamente **100 itens**, posições 1–100 sem furo nem repetição.
2. `value` único no tema (após normalização); `aliases` opcionais, também únicos.
3. Posição 1 = mais óbvio/popular; 100 = mais obscuro. Ordem aproximada é aceitável (DOMAIN §5).
4. Matching usa normalização de DOMAIN §4 sobre `value` + `aliases`.
5. Novo tema = novo arquivo + entrada no `index.json`. Validar com o checklist de `data/themes/README.md`.
