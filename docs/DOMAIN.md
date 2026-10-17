# DOMAIN — regras do jogo

Fonte de verdade das regras. O código implementa o que está aqui; o que diverge é bug ou pede ADR.

## §1 Conceito
Party game multiplayer de **rankings ocultos**. Uma sala tem um tema ("Top 100 maiores cidades do mundo"). O sistema carrega um ranking secreto de 100 itens, ordenado do mais óbvio/popular (posição 1) ao mais obscuro (posição 100). A cada rodada, cada jogador dá um palpite. Palpite que está no ranking vale **pontos = posição do item**. Vence quem somar mais pontos.

> Mantra do jogo: **quanto mais fundo no ranking, mais pontos** — chutar o óbvio vale pouco.

## §2 Sala
- Código de 6 caracteres para entrar.
- **2 a 5 jogadores**. Partida não inicia com menos de 2; sala cheia recusa entrada.
- **Host** = criador da sala; só ele inicia a partida.
- Configuração na criação: nº de rodadas **3/5/7/10** (padrão 5) e tempo por rodada — atalhos **15/30/45/60s** ou valor **personalizado** (segundos ou minutos), entre **10s e 600s (10min)**; padrão 30s.
- Tema: digitado pelo host (casado com o banco de temas, ver §5) ou sorteado ("tema aleatório").
- Não se entra em partida já iniciada.

## §3 Rodada
- Fase ANSWERING: todos palpitam dentro do tempo. 1 palpite por jogador por rodada.
- Rodada fecha quando **todos responderam** ou o **tempo expira** (quem não respondeu marca 0).
- **Pausa**: o host pode pausar e retomar o cronômetro durante ANSWERING. Pausado, o tempo restante fica congelado e palpites são recusados; ao retomar, o prazo é recalculado a partir do tempo que sobrou.
- Durante ANSWERING, ninguém vê o palpite nem os pontos dos outros — só **quem já respondeu** (nem a API envia).
- Fase RESULT (revelação): mostra o palpite de cada jogador, acerto/erro, posição no ranking e pontos.
- Depois da revelação: próxima rodada, ou verificação de fim (§6).

## §4 Pontuação e matching
- Acerto: pontos = posição do item (1–100). Erro (fora do Top 100): 0 pontos.
- **Item vale uma vez por partida** (global): item já pontuado por qualquer jogador em uma rodada **anterior** não pontua de novo. Palpite repetido = 0 pontos, marcado como "já usado" na revelação.
- **Mesmo item na mesma rodada pontua para todos** que o acertaram (não só para quem enviou primeiro). A partir da rodada seguinte, ele passa a valer 0.
- Matching é **normalizado**: caixa baixa, sem acentos, trim, espaços colapsados, pontuação que separa palavras (hífen, barra, ponto, apóstrofo…) tratada como espaço; e considera os `aliases` do item (ex.: "NYC" → "Nova York"). Ver `db/SCHEMA.md`.
- A comparação ignora espaços: grafias igualmente válidas casam entre si ("he man" = "He-Man" = "heman"; "mcdonalds" = "McDonald's"; "acdc" = "AC/DC"). Palavra parcial não casa ("man" ≠ "He-Man").
- Empate de string após normalização = acerto. Não usar igualdade exata crua.

## §5 Temas e rankings (invariante — ADR-0001)
- **Custo zero de IA em runtime.** Rankings vêm do banco local `data/themes/*.json` (100 itens + aliases, curados).
- Tema digitado é casado com o banco por similaridade (normalização + palavras, com fuzzy simples). Busca ambígua ou sem correspondência: oferecer temas próximos ou sorteio.
- Tema livre por IA (ADR-0003): com `ENABLE_AI_FALLBACK=true`, tema sem casamento forte no banco é gerado pelo Gemini (free tier; Groq/OpenRouter de reserva). Nunca pode gerar custo.
  - A IA gera também os `aliases` de cada item (sobrenome, sigla, nome em inglês) e devolve o nome sem detalhes entre parênteses.
  - **Tema pequeno**: se o assunto não tem 100 itens reais ("planetas", "estados do Brasil"), o ranking gerado fica menor — mínimo de **30 itens**; abaixo disso, a geração falha. Pontos continuam = posição. Lobby e jogo avisam "lista menor: N itens, máximo N pontos por palpite".
  - O ranking gerado é guardado por tema normalizado e reaproveitado quando o mesmo tema livre é pedido de novo.
- Ordem dos itens é aproximada por natureza; a curadoria prioriza plausibilidade e diversão, não precisão estatística.

## §6 Fim de jogo e empate
- Após a última rodada: maior pontuação vence.
- **Empate na liderança → morte súbita**: rodada extra com a mesma mecânica, só entre os empatados; repete até desempatar.
- Tela final: ranking dos jogadores, vencedor, **Top 100 completo revelado**, "jogar novamente" (mesma sala; o host escolhe **repetir o tema** — mesmo ranking, inclusive o gerado por IA — ou **tema aleatório**) e "nova sala".

## §7 Segredo do ranking (invariante — ADR-0002)
- O ranking **nunca** trafega para o cliente enquanto `status ≠ FINISHED`. A API responde o estado do jogo **sem** o campo `ranking` (e sem nada que o derive) durante a partida. Única exceção: `rankingSize` (só a quantidade de itens, não revela nenhum).
- A conferência do palpite acontece só no servidor.

## §8 Estados da partida
```
RANKING_READY (lobby) → STARTED (rodadas: ANSWERING ⇄ RESULT)
  → [empate na liderança ao fim da última rodada] → SUDDEN_DEATH (rodada extra só entre os empatados; repete até desempatar)
  → FINISHED
```
`SUDDEN_DEATH` reusa a mesma mecânica de rodada (ANSWERING → fecha), mas só os jogadores em `tiedPlayerIds` respondem — os demais assistem (§6). "Jogar novamente" cria um novo documento (mesmo grupo de jogadores, pontuações zeradas) e não é um estado da partida em si.
