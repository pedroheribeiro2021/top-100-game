# DOMAIN — regras do jogo

Fonte de verdade das regras. O código implementa o que está aqui; o que diverge é bug ou pede ADR.

## §1 Conceito
Party game multiplayer de **rankings ocultos**. Uma sala tem um tema ("Top 100 maiores cidades do mundo"). O sistema carrega um ranking secreto de 100 itens, ordenado do mais óbvio/popular (posição 1) ao mais obscuro (posição 100). A cada rodada, cada jogador dá um palpite. Palpite que está no ranking vale **pontos = posição do item**. Vence quem somar mais pontos.

> Mantra do jogo: **quanto mais fundo no ranking, mais pontos** — chutar o óbvio vale pouco.

## §2 Sala
- Código de 6 caracteres para entrar.
- **2 a 5 jogadores**. Partida não inicia com menos de 2; sala cheia recusa entrada.
- **Host** = criador da sala; só ele inicia a partida.
- Configuração na criação: nº de rodadas **3/5/7/10** (padrão 5) e tempo por rodada **15/30/45/60s** (padrão 30s).
- Tema: digitado pelo host (casado com o banco de temas, ver §5) ou sorteado ("tema aleatório").
- Não se entra em partida já iniciada.

## §3 Rodada
- Fase ANSWERING: todos palpitam dentro do tempo. 1 palpite por jogador por rodada.
- Rodada fecha quando **todos responderam** ou o **tempo expira** (quem não respondeu marca 0).
- Fase RESULT (revelação): mostra o palpite de cada jogador, acerto/erro, posição no ranking e pontos.
- Depois da revelação: próxima rodada, ou verificação de fim (§6).

## §4 Pontuação e matching
- Acerto: pontos = posição do item (1–100). Erro (fora do Top 100): 0 pontos.
- **Item vale uma vez por partida** (global): item já pontuado por qualquer jogador em qualquer rodada não pontua de novo. Palpite repetido = 0 pontos, marcado como "já usado" na revelação.
- Matching é **normalizado**: caixa baixa, sem acentos, trim, espaços colapsados; e considera os `aliases` do item (ex.: "NYC" → "Nova York"). Ver `db/SCHEMA.md`.
- Empate de string após normalização = acerto. Não usar igualdade exata crua.

## §5 Temas e rankings (invariante — ADR-0001)
- **Custo zero de IA em runtime.** Rankings vêm do banco local `data/themes/*.json` (100 itens + aliases, curados).
- Tema digitado é casado com o banco por similaridade (normalização + fuzzy simples). Sem correspondência: oferecer temas próximos ou sorteio; provedores gratuitos (Groq/OpenRouter) são fallback **opcional** e nunca podem gerar custo.
- Ordem dos itens é aproximada por natureza; a curadoria prioriza plausibilidade e diversão, não precisão estatística.

## §6 Fim de jogo e empate
- Após a última rodada: maior pontuação vence.
- **Empate na liderança → morte súbita**: rodada extra com a mesma mecânica, só entre os empatados; repete até desempatar.
- Tela final: ranking dos jogadores, vencedor, **Top 100 completo revelado**, "jogar novamente" (mesma sala/novo tema) e "nova sala".

## §7 Segredo do ranking (invariante — ADR-0002)
- O ranking **nunca** trafega para o cliente enquanto `status ≠ FINISHED`. A API responde o estado do jogo **sem** o campo `ranking` (e sem nada que o derive) durante a partida.
- A conferência do palpite acontece só no servidor.

## §8 Estados da partida
```
RANKING_READY (lobby) → STARTED (rodadas: ANSWERING ⇄ RESULT)
  → [empate na liderança ao fim da última rodada] → SUDDEN_DEATH (rodada extra só entre os empatados; repete até desempatar)
  → FINISHED
```
`SUDDEN_DEATH` reusa a mesma mecânica de rodada (ANSWERING → fecha), mas só os jogadores em `tiedPlayerIds` respondem — os demais assistem (§6). "Jogar novamente" cria um novo documento (mesmo grupo de jogadores, pontuações zeradas) e não é um estado da partida em si.
