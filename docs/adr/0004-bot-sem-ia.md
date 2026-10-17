# ADR-0004 — Bot jogador sem IA, decidido no servidor

**Status:** aceito
**Data:** 2026-10-16

## Contexto
O produto quer permitir jogar sozinho contra um "bot" e completar salas pequenas. A partida exige 2–5 jogadores (DOMAIN §2) e o projeto tem custo zero de IA em runtime (ADR-0001).

## Decisão
- O bot é um **jogador da sala** (`players[]` com `isBot: true` e `botLevel`), adicionado/removido pelo host no lobby (`POST /games/:id/bots`, `DELETE /games/:id/bots/:botId`). Conta para o mínimo de 2 e o máximo de 5.
- **Sem IA**: o servidor já conhece o ranking secreto; o bot sorteia um item ainda não usado numa faixa do ranking por dificuldade (fácil: topo 0–30%; médio: 15–55%; difícil: 35–85%) e às vezes "não lembra" (0 pts; 30/20/15%). Média por rodada num Top 100: ~12 / ~29 / ~55 pts.
- O bot **palpita quando a rodada abre** (start ou fechamento da rodada anterior), sem agendador. Cada palpite guarda `revealAt` (3–12s): a API só mostra o "respondeu" do bot depois disso, para parecer gente. A pontuação usa a mesma regra dos humanos (`scoreAnswer`).
- Rodada em que só bots estão ativos (morte súbita sem humanos) fecha na hora, em sequência, até desempatar (limite de 10; depois disso o timeout normal resolve).
- `/answer` recusa o id de um bot (`PLAYER_NOT_FOUND`).

## Consequências
+ Jogo solo e salas completas sem custo, sem cota de IA e sem latência.
+ Depende de os palpites ficarem ocultos durante a rodada (só `playerId` vai ao cliente), senão o palpite do bot vazaria.
− O bot não "entende" o tema: escolhe só pela posição, então não erra de forma plausível (o erro aparece como "(não lembrou)").
